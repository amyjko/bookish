import { auth, db, functions } from './Firebase';
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
    DocumentReference,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import Edition from './book/Edition';
import type { EditionSpecification } from './book/Edition';
import Book from './book/Book';
import type { BookSpecification } from './book/Book';
import type { ChapterContent } from './book/Chapter';

export async function getPublishedBooks(): Promise<Book[]> {
    if (!db)
        throw Error("Can't retrieve books, not connected to the database.");

    try {
        const data = await getDocs(collection(db, 'books'));
        return data.docs
            .map((doc) =>
                Book.fromJSON(doc.ref, doc.data() as BookSpecification)
            )
            .filter((book) => book.hasPublishedEdition());
    } catch {
        throw Error("Couldn't load books, problem reading from the database.");
    }
}

export async function getUserBooks(userID: string): Promise<Book[] | null> {
    if (!db)
        throw Error("Can't retrieve user's books, not connected to Firebase.");

    try {
        // Find books that this user has access to.
        const books = await getDocs(
            query(
                collection(db, 'books'),
                where('uids', 'array-contains', userID)
            )
        );

        // const editions = await getDocs(
        //     query(
        //         collection(db, 'editions'),
        //         where('uids', 'array-contains', userID)
        //     )
        // );

        return books.docs.map((doc) =>
            Book.fromJSON(doc.ref, doc.data() as BookSpecification)
        );
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function getUserEmails(
    uids: string[]
): Promise<Record<string, string> | null> {
    if (!functions)
        throw Error("Can't publish, no connection to Firebase functions.");

    const getUserEmails = httpsCallable<
        { uids: string[] },
        Record<string, string>
    >(functions, 'getUserEmails');

    const result = await getUserEmails({
        uids,
    });

    return result.data;
}

export async function createUser(email: string): Promise<string | null> {
    if (!functions)
        throw Error("Can't publish, no connection to Firebase functions.");

    const createUserWithEmail = httpsCallable<{ email: string }, string>(
        functions,
        'createUserWithEmail'
    );

    const result = await createUserWithEmail({
        email,
    });

    return result.data;
}

export async function getBookFromIDOrName(
    bookIDOrName: string
): Promise<Book | null> {
    const book = await readBook(bookIDOrName);

    if (book) return book;

    const bookID = await getBookIDFromName(bookIDOrName);
    return bookID !== null ? readBook(bookID) : null;
}

export async function readBook(bookID: string): Promise<Book | null> {
    if (!db) return null;

    const bookRef = doc(db, 'books', bookID);
    const book = await getDoc(bookRef);
    return !book.exists()
        ? null
        : Book.fromJSON(bookRef, book.data() as BookSpecification);
}

export async function readEdition(editionID: string): Promise<Edition> {
    if (!db) throw Error("Can't retrieve edition, not connected to Firebase.");

    const editionDoc = await getDoc(doc(db, 'editions', editionID));
    if (!editionDoc.exists()) throw Error('' + editionID + " doesn't exist");

    // TODO We should really be doing some validation here.
    let edition = editionDoc.data() as EditionSpecification;

    // Go through each of the edition's chapters and get its text.
    for (const chapter of edition.chapters) {
        if (chapter.ref) {
            const { text } = await readChapterText(chapter.ref);
            chapter.text = text;
        }
    }

    return Edition.fromJSON(editionDoc.ref, edition);
}

export const createBook = async (userID: string): Promise<string> => {
    if (!db) throw Error("Can't create book, not connected to Firebase.");

    // Make a new default edition with a single chapter with this user id.
    let newEdition = new Edition(
        undefined,
        undefined,
        [userID],
        'Untitled',
        [],
        {},
        '',
        [],
        'All rights reserved.',
        '',
        [],
        {},
        {},
        {},
        {},
        null
    ).withNewChapter();

    // Add the edition to the editions collection in the database so we can get an edition ref.
    const editionRef = await addDoc(
        collection(db, 'editions'),
        newEdition.toObject()
    );

    // Remember the ref.
    newEdition = newEdition.withRef(editionRef);

    // Note that we don't create a sub-collection of chapters here.
    // Firestore creates sub-collections automatically when documents are added.

    // Create a new book with the draft first edition and the user ID.
    const newBook: BookSpecification = {
        title: '',
        authors: [],
        description: '',
        cover: null,
        editions: [
            {
                ref: editionRef,
                time: Date.now(),
                summary: '',
                published: false,
            },
        ],
        uids: [userID],
    };

    // Create the book
    const bookRef = await addDoc(collection(db, 'books'), newBook);

    // Update all of the changes to the edition in Firestore, persisting the refs and chapter text.
    await updateEdition(undefined, newEdition);

    // Return the book id
    return bookRef.id;
};

export async function createNewEdition(book: Book): Promise<Book> {
    if (!db) throw Error("Can't publish draft, no Firebase connection.");

    // Get the latest draft.
    const latestDraft = await book.getDraftEdition();
    if (latestDraft === undefined) return book;

    // Make a copy without chapter and edition refs, because we want to create new ones.
    const newEdition = latestDraft.withoutRefs();

    // Create a copy of the existing draft as a new edition, but without any chapter refs.
    const newEditionRef = await addDoc(
        collection(db, 'editions'),
        newEdition.toObject()
    );

    // Update the edition, creating chapter text as necessary.
    updateEdition(undefined, newEdition.withRef(newEditionRef));

    // Put the new edition in the book.
    const revisions = book.getEditions();
    revisions.unshift({
        ref: newEditionRef,
        time: Date.now(),
        summary: '',
        published: false,
    });

    book = book.withEditions(revisions);

    // Return the revised Book's revision.'
    updateBook(book);

    return book;
}

export const updateEdition = async (
    previousEdition: Edition | undefined,
    newEdition: Edition
): Promise<Edition> => {
    if (!db) throw Error("Can't update edition, not connected to Firebase.");

    // Get the reference to the edition, fail if we don't have one.
    const editionRef = newEdition.getRef();
    if (!editionRef) throw Error('Book given has no ID');

    // Create any new chapters that aren't in the current edition, and update text if it changed.
    for (const newChapter of newEdition.chapters) {
        if (newChapter.ref === undefined) {
            // Make the new chapter's text.
            const newChapterRef = await addDoc(
                collection(db, `editions/${editionRef.id}/chapters`),
                { text: newChapter.text }
            );

            // Add the ref of the new chapter to the revised chapter.
            newEdition = newEdition.withRevisedChapter(
                newChapter,
                newChapter.withRef(newChapterRef)
            );
        }
        // If we have a previous version, did the text change? If so, update it.
        else if (previousEdition) {
            const previousChapter = previousEdition.getChapterByRef(
                newChapter.ref
            );
            if (previousChapter && newChapter.text !== previousChapter.text) {
                await setDoc(
                    doc(
                        db,
                        `editions/${editionRef.id}/chapters`,
                        newChapter.ref.id
                    ),
                    { text: newChapter.text }
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

    // Finally, update the edition's document.
    await setDoc(doc(db, 'editions', editionRef.id), newEdition.toObject());

    return newEdition;
};

export async function updateBook(book: Book): Promise<void> {
    if (!db) throw Error("Can't update book, not connected to Firebase.");

    await setDoc(doc(db, 'books', book.getRefID()), book.toJSON());
}

export async function readChapterText(
    chapterRef: DocumentReference
): Promise<ChapterContent> {
    if (!db) throw Error('Not connected to Firebase.');

    const text = await getDoc(chapterRef);
    if (!text.exists()) throw Error('Chapter text does not exist.');

    return text.data() as ChapterContent;
}

export async function isSubdomainAvailable(
    subdomain: string,
    book: Book
): Promise<boolean> {
    if (!db) throw Error('Not connected to Firebase.');

    const matches = await getDocs(
        query(collection(db, 'books'), where('domain', '==', subdomain))
    );

    return matches.empty || matches.docs[0].id === book.getRefID();
}

export async function getBookIDFromName(
    subdomain: string
): Promise<string | null> {
    if (!db)
        throw Error("Can't find book ID from URL, not connected to Firebase.");

    const matches = await getDocs(
        query(collection(db, 'books'), where('domain', '==', subdomain))
    );

    if (!matches.empty) return matches.docs[0].id;
    else return null;
}

export async function publish(
    book: Book,
    index: number
): Promise<string | undefined> {
    if (!db) throw Error("Can't publish, no Firebase connection.");
    if (!functions)
        throw Error("Can't publish, no connection to Firebase functions.");

    const edition = await book.getEditionNumber(index + 1);
    if (edition === undefined)
        return `Couldn't find edition ${index} number to publish`;

    const editionRef = edition.getRef();
    if (editionRef === undefined) return `Couldn't find edition to publish`;

    const publishEdition = httpsCallable<
        { book: string; edition: string },
        string
    >(functions, 'publishEdition');

    const result = await publishEdition({
        book: book.getRef().id,
        edition: editionRef.id,
    });

    return result.data;

    // Update the edition's published status in the book.
    // await updateBook(book.withEditionAsPublished(true, index));
}
