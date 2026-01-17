import { db, functions } from './Firebase';
import {
    collection,
    getDocs,
    getDoc,
    setDoc,
    doc,
    addDoc,
    query,
    where,
    deleteDoc,
    type DocumentReference,
    type QueryFieldFilterConstraint,
    onSnapshot,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import Edition from './book/Edition';
import type { EditionSpecification } from './book/Edition';
import Book, { type EditionInfo } from './book/Book';
import type { BookSpecification } from './book/Book';
import type { Unsubscribe } from 'firebase/auth';

function editionPath(bookID: string, editionID: string) {
    return `books/${bookID}/editions/${editionID}`;
}

const NO_DATABASE_CONNECTION = 'Not connected to database';

///////////////
//// READ BOOKS
///////////////

function listenToBooks(
    constraint: QueryFieldFilterConstraint,
    react: (books: Book[]) => void,
): Unsubscribe {
    if (!db) throw NO_DATABASE_CONNECTION;
    try {
        return onSnapshot(
            query(collection(db, 'books'), constraint),
            (snapshot) =>
                react(
                    snapshot.empty
                        ? []
                        : snapshot.docs.map((doc) =>
                              Book.fromJSON(
                                  doc.id,
                                  doc.data() as BookSpecification,
                              ),
                          ),
                ),
        );
    } catch (err) {
        throw 'Issue querying database';
    }
}

export function listenToPublishedBooks(
    react: (books: Book[]) => void,
): Unsubscribe {
    return listenToBooks(where('published', '==', true), react);
}

export function listenToEditableBooks(
    userID: string,
    react: (books: Book[]) => void,
): Unsubscribe {
    return listenToBooks(where('uids', 'array-contains', userID), react);
}

export function listenToPartiallyEditableBooks(
    userID: string,
    react: (books: Book[]) => void,
): Unsubscribe {
    return listenToBooks(where('readuids', 'array-contains', userID), react);
}

export function listenToBooksByName(
    name: string,
    react: (book: Book[]) => void,
): Unsubscribe {
    return listenToBooks(where('domain', '==', name), react);
}

export function listenToBookWithID(
    id: string,
    react: (book: Book | null) => void,
): Unsubscribe {
    if (!db) throw NO_DATABASE_CONNECTION;
    const ref = doc(db, 'books', id);
    return onSnapshot(doc(db, 'books', id), (doc) => {
        if (!doc.metadata.hasPendingWrites)
            react(
                doc.exists()
                    ? Book.fromJSON(id, doc.data() as BookSpecification)
                    : null,
            );
    });
}

export function listenToEdition(
    bookID: string,
    editionID: string,
    react: (edition: Edition | null) => void,
): Unsubscribe {
    if (!db) throw NO_DATABASE_CONNECTION;

    return onSnapshot(
        doc(db, 'books', bookID, 'editions', editionID),
        (doc) => {
            if (!doc.metadata.hasPendingWrites)
                react(
                    doc.exists()
                        ? Edition.fromJSON(
                              doc.ref,
                              doc.data() as EditionSpecification,
                          )
                        : null,
                );
        },
    );
}

export function listenToChapters(
    bookID: string,
    editionID: string,
    react: (chapters: [DocumentReference, string][]) => void,
): Unsubscribe {
    if (!db) throw NO_DATABASE_CONNECTION;

    return onSnapshot(
        collection(db, 'books', bookID, 'editions', editionID, 'chapters'),
        (docs) => {
            const chapters: [DocumentReference, string][] = [];
            // For each chapter in the book, if the doc exists and it's not a pending local write, send updated chapters to the front end.
            docs.forEach((doc) => {
                // We propagate pending writes to cycle back local edits to the client.
                if (doc.exists())
                    // If the chapter text is somehow null, set it to an empty string.
                    // This accounts for previous defects that could lead to null.
                    chapters.push([doc.ref, doc.data().text ?? '']);
            });
            react(chapters);
        },
    );
}

/////////////////
//// MANAGE USERS
/////////////////

/** Hit the authentication database to get user emails. */
export async function getUserEmails(
    uids: string[],
): Promise<Map<string, string> | null> {
    if (!functions)
        throw Error("Can't publish, no connection to Firebase functions.");

    const getUserEmails = httpsCallable<
        { uids: string[] },
        Record<string, string>
    >(functions, 'getUserEmailsGen2');

    const result = await getUserEmails({
        uids,
    });

    return new Map(Object.entries(result.data));
}

export async function createUser(email: string): Promise<string | null> {
    if (!functions)
        throw Error("Can't publish, no connection to Firebase functions.");

    const createUserWithEmail = httpsCallable<{ email: string }, string>(
        functions,
        'createUserWithEmailGen2',
    );

    const result = await createUserWithEmail({
        email,
    });

    return result.data;
}

export async function createBook(userID: string): Promise<string> {
    if (!db) throw Error("Can't create book, not connected to Firebase.");

    // Create a new book
    const newBookData: BookSpecification = {
        title: 'Untitled',
        authors: [],
        description: '',
        cover: null,
        published: false,
        domain: null,
        editions: [],
        uids: [userID],
        readuids: [],
    };

    // Create the book
    const bookRef = await addDoc(collection(db, 'books'), newBookData);

    // Create a model to store it.
    let book = Book.fromJSON(bookRef.id, newBookData);

    // Make a new default edition with a single chapter with this user id.
    let newEdition = new Edition(
        bookRef,
        undefined,
        [],
        'Untitled',
        [],
        1,
        '',
        null,
        {},
        undefined,
        '',
        [],
        'All rights reserved.',
        '',
        [],
        {},
        {},
        {},
        {},
        null,
        null,
        {},
        null,
    ).withNewChapter();

    // Add the edition to the editions collection in the database so we can get an edition ref.
    const editionRef = await addDoc(
        collection(db, 'books', bookRef.id, 'editions'),
        newEdition.toObject(),
    );

    // Remember the ref.
    newEdition = newEdition.withRef(editionRef);

    // Now replicate the edition info in the book. We dodge type checking here because we know with certainty
    // that the ref was just added the line before.
    const info = newEdition.getInfo();
    if (info) book = book.withEditions([info]);

    // Update the book with the edition info.
    await updateBook(book);

    // Update all of the changes to the edition in Firestore, persisting the refs and chapter text.
    await updateEdition(book, undefined, newEdition);

    // Return the book id
    return bookRef.id;
}

export async function createNewEdition(book: Book): Promise<Book> {
    if (!db) throw Error("Can't create new edition, no Firebase connection.");

    // Get the latest draft.
    const latestEditionID = book.getLatestEditionID();
    if (latestEditionID === undefined) throw 'No editions on this book';

    const latestDraftDoc = await getDoc(
        doc(db, 'books', book.id, 'editions', latestEditionID),
    );
    const latestDraftData: EditionSpecification | undefined =
        latestDraftDoc.exists()
            ? (latestDraftDoc.data() as EditionSpecification | undefined)
            : undefined;

    // No latest draft? Return the book as is.
    if (latestDraftData === undefined) return book;

    const latestDraft = Edition.fromJSON(latestDraftDoc.ref, latestDraftData);

    // Make a copy without chapter and edition refs, because we want to create new ones,
    // and with an incremented edition number.
    let newEdition = latestDraft.withoutRefs();

    // Create a copy of the existing draft as a new edition.
    const newEditionRef = await addDoc(
        collection(db, 'books', book.id, 'editions'),
        newEdition.toObject(),
    );

    newEdition = newEdition
        .withRef(newEditionRef)
        .withIncrementedEditionNumber();

    // Save the edition, creating chapter text as necessary, using the edition sync function.
    await updateEdition(book, undefined, newEdition);

    // Put the new edition in the book.
    book = book.withEditions([
        newEdition.getInfo() as EditionInfo,
        ...book.getEditions(),
    ]);

    // Update the book.
    await updateBook(book);

    return book;
}

export async function updateLock(
    edition: Edition,
    uid: string,
    content: string,
    lock: boolean,
): Promise<boolean> {
    if (!db) throw NO_DATABASE_CONNECTION;
    if (edition.editionRef === undefined) return false;

    if (lock && edition.hasLease(uid, content)) return true;
    if (!lock && !edition.hasLease(uid, content)) return true;

    await setDoc(
        doc(db, editionPath(edition.bookRef.id, edition.editionRef.id)),
        edition.withLock(uid, content, lock).toObject(),
    );
    return lock;
}

/**
 * Persists the edition in the database, creating and deleting chapters as necessary.
 * returns a map of DocumentReferences for new chapters so they can be persisted client side.
 */
export async function updateEdition(
    book: Book,
    previousEdition: Edition | undefined,
    newEdition: Edition,
): Promise<Map<string, DocumentReference>> {
    if (!db) throw Error("Can't update edition, not connected to Firebase.");

    // Get the reference to the edition, fail if we don't have one.
    const editionRef = newEdition.getEditionRef();
    if (!editionRef) throw Error('Book given has no ID');

    const newChapterRefs = new Map<string, DocumentReference>();

    // Create any new chapters that aren't in the current edition, and update text if it changed.
    for (const newChapter of newEdition.chapters) {
        if (newChapter.ref === undefined) {
            // Make the new chapter's text.
            const newChapterRef = await addDoc(
                collection(
                    db,
                    editionPath(newEdition.bookRef.id, editionRef.id),
                    'chapters',
                ),
                // If the new chapter has null text, set it to empty string
                { text: newChapter.text ?? '' },
            );

            // Add the ref of the new chapter to the revised chapter.
            newEdition = newEdition.withRevisedChapter(
                newChapter,
                newChapter.withRef(newChapterRef),
            );

            // Map the chapter ref to it's id.
            newChapterRefs.set(newChapter.id, newChapterRef);
        }
        // If we have a previous version, did the text change? If so, update it.
        else {
            const previousChapter =
                previousEdition === undefined
                    ? undefined
                    : previousEdition.getChapterByRef(newChapter.ref);
            if (
                // A null chapter text means that we haven't loaded it yet from the database, so we
                // only set it if it's not null.
                newChapter.text !== null &&
                (previousChapter === undefined ||
                    newChapter.text !== previousChapter.text)
            ) {
                await setDoc(
                    doc(
                        db,
                        editionPath(newEdition.bookRef.id, editionRef.id),
                        'chapters',
                        newChapter.ref.id,
                    ),
                    { text: newChapter.text },
                );
            }
        }
    }

    // Remove any chapters from Firebase that are removed.
    if (previousEdition) {
        for (const previousChapter of previousEdition.chapters) {
            if (
                previousChapter.ref &&
                newEdition.getChapterByRef(previousChapter.ref) === undefined
            ) {
                await deleteDoc(previousChapter.ref);
            }
        }
    }

    // If the edition's summary info changed, update it.
    if (previousEdition !== undefined) {
        const previousInfo = previousEdition.getInfo();
        const newInfo = newEdition.getInfo();
        if (previousInfo && newInfo) {
            const previousKeys = Object.keys(
                previousInfo,
            ) as (keyof EditionInfo)[];
            const newKeys = Object.keys(newInfo) as (keyof EditionInfo)[];
            if (
                previousKeys.length !== newKeys.length ||
                !previousKeys.every((key) => previousInfo[key] === newInfo[key])
            ) {
                updateBook(
                    book.withRevisedEdition(previousEdition, newEdition),
                );
            }
        }
    }

    // Finally, update the edition's document.
    await setDoc(
        doc(db, editionPath(newEdition.bookRef.id, editionRef.id)),
        newEdition.toObject(),
    );

    return newChapterRefs;
}

export async function updateBook(book: Book): Promise<void> {
    if (!db) throw Error("Can't update book, not connected to Firebase.");

    await setDoc(doc(db, 'books', book.getID()), book.toJSON());
}

export async function isSubdomainAvailable(
    subdomain: string,
): Promise<boolean> {
    if (!db) throw Error('Not connected to Firebase.');

    return (await getBookIDWithSubdomain(subdomain)) === null;
}

export async function getBookIDWithSubdomain(
    subdomain: string,
): Promise<string | null> {
    if (!db) throw Error('Not connected to Firebase.');
    const matches = await getDocs(
        query(collection(db, 'books'), where('domain', '==', subdomain)),
    );

    return matches.empty ? null : matches.docs[0].id;
}

export async function publish(
    edition: Edition,
): Promise<string | { url: string }> {
    if (!db) throw Error('Cannot publish, no database connection');
    if (!functions) throw Error('Cannot publish, no cloud connection');

    const editionRef = edition.getEditionRef();
    const bookRef = edition.getBookRef();

    if (editionRef === undefined) return `Cannot publish, no edition ID`;

    // Get a reference to the publishing function
    const publishEdition = httpsCallable<
        { bookID: string; editionID: string },
        string
    >(functions, 'publishEdition');

    // Call the function, passing
    const result = await publishEdition({
        bookID: bookRef.id,
        editionID: editionRef.id,
    });

    return result.data;

    // Update the edition's published status in the book.
    // await updateBook(book.withEditionAsPublished(true, index));
}
