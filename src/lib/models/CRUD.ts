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
    DocumentReference,
    onSnapshot,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import Edition from './book/Edition';
import type { EditionSpecification } from './book/Edition';
import Book, { type EditionInfo } from './book/Book';
import type { BookSpecification } from './book/Book';
import type { ChapterContent } from './book/Chapter';
import type { Unsubscribe } from 'firebase/auth';

function editionPath(bookID: string, editionID: string) {
    return `books/${bookID}/editions/${editionID}`;
}

export function getPublishedBooks(
    listener: (books: Book[]) => void
): Unsubscribe | string {
    if (!db) return "Can't retrieve books from the database";

    const publishedBooksQuery = query(
        collection(db, 'books'),
        where('published', '==', true)
    );
    return onSnapshot(publishedBooksQuery, (snapshot) =>
        listener(
            snapshot.docs.map((doc) =>
                Book.fromJSON(doc.ref, doc.data() as BookSpecification)
            )
        )
    );
}

export async function getUserBooks(userID: string): Promise<Book[] | null> {
    if (!db)
        throw Error("Can't retrieve user's books, not connected to Firebase.");

    try {
        // Find books that this user book-level access to.
        const editableBooks = await getDocs(
            query(
                collection(db, 'books'),
                where('uids', 'array-contains', userID)
            )
        );
        // Find books that this user has edition or chapter level access to.
        const partiallyEditableBooks = await getDocs(
            query(
                collection(db, 'books'),
                where('readuids', 'array-contains', userID)
            )
        );

        // Merge and deduplicate the books
        const allBooks = [
            ...editableBooks.docs,
            ...partiallyEditableBooks.docs,
        ].filter(
            (doc1, index1, docs) =>
                !docs.some(
                    (doc2, index2) => index2 > index1 && doc1.id === doc2.id
                )
        );

        return allBooks.map((doc) =>
            Book.fromJSON(doc.ref, doc.data() as BookSpecification)
        );
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function getUserEmails(
    uids: string[]
): Promise<Map<string, string> | null> {
    if (!functions)
        throw Error("Can't publish, no connection to Firebase functions.");

    const getUserEmails = httpsCallable<
        { uids: string[] },
        Record<string, string>
    >(functions, 'getUserEmails');

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

export async function readEdition(
    bookID: string,
    editionID: string
): Promise<Edition> {
    if (!db) throw Error("Can't retrieve edition, not connected to Firebase.");

    const editionDoc = await getDoc(
        doc(db, 'books', bookID, 'editions', editionID)
    );
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

export async function createBook(userID: string): Promise<string> {
    if (!db) throw Error("Can't create book, not connected to Firebase.");

    // Create a new book
    const newBookData: BookSpecification = {
        title: 'Untitled',
        authors: [],
        description: '',
        cover: null,
        published: false,
        editions: [],
        uids: [userID],
        readuids: [],
    };

    // Create the book
    const bookRef = await addDoc(collection(db, 'books'), newBookData);

    // Create a model to store it.
    let book = Book.fromJSON(bookRef, newBookData);

    // Make a new default edition with a single chapter with this user id.
    let newEdition = new Edition(
        bookRef,
        undefined,
        [],
        'Untitled',
        ['Anonymous'],
        1,
        '',
        null,
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
        collection(db, 'books', bookRef.id, 'editions'),
        newEdition.toObject()
    );

    // Remember the ref.
    newEdition = newEdition.withRef(editionRef);

    // Now replicate the edition info in the book. We dodge type checking here because we know with certainty
    // that the ref was just added the line before.
    book = book.withEditions([newEdition.getInfo() as EditionInfo]);

    // Update the book with the edition info.
    await updateBook(book);

    // Update all of the changes to the edition in Firestore, persisting the refs and chapter text.
    await updateEdition(undefined, newEdition);

    // Return the book id
    return bookRef.id;
}

export async function createNewEdition(book: Book): Promise<Book> {
    if (!db) throw Error("Can't publish draft, no Firebase connection.");

    // Get the latest draft.
    const latestDraft = await book.getLatestEdition();
    if (latestDraft === undefined) return book;

    // Make a copy without chapter and edition refs, because we want to create new ones,
    // and with an incremented edition number.
    const newEdition = latestDraft.withoutRefs();

    // Create a copy of the existing draft as a new edition.
    const newEditionRef = await addDoc(
        collection(db, 'editions'),
        newEdition.toObject()
    );

    // Create the edition, creating chapter text as necessary, using the edition sync function.
    updateEdition(undefined, newEdition.withRef(newEditionRef));

    // Put the new edition in the book.
    book = book.withEditions([
        newEdition.getInfo() as EditionInfo,
        ...book.getEditions(),
    ]);

    // Update the book.
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
                collection(
                    db,
                    editionPath(newEdition.bookRef.id, editionRef.id),
                    'chapters'
                ),
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
                        editionPath(newEdition.bookRef.id, editionRef.id),
                        'chapters',
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

    // If the edition's summary info changed, update it.
    if (previousEdition !== undefined) {
        const previousInfo = previousEdition.getInfo();
        const newInfo = newEdition.getInfo();
        if (previousInfo && newInfo) {
            const previousKeys = Object.keys(
                previousInfo
            ) as (keyof EditionInfo)[];
            const newKeys = Object.keys(newInfo) as (keyof EditionInfo)[];
            if (
                previousKeys.length !== newKeys.length ||
                !previousKeys.every((key) => previousInfo[key] === newInfo[key])
            ) {
                const bookDoc = await getDoc(
                    doc(db, 'books', newEdition.bookRef.id)
                );
                if (!bookDoc.exists()) throw Error('Book does not exist');
                const book = Book.fromJSON(
                    newEdition.bookRef,
                    bookDoc.data() as BookSpecification
                );
                updateBook(
                    book.withRevisedEdition(previousEdition, newEdition)
                );
            }
        }
    }

    // Finally, update the edition's document.
    await setDoc(
        doc(db, editionPath(newEdition.bookRef.id, editionRef.id)),
        newEdition.toObject()
    );

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

// export async function publish(
//     book: Book,
//     index: number
// ): Promise<string | undefined> {
//     if (!db) throw Error("Can't publish, no Firebase connection.");
//     if (!functions)
//         throw Error("Can't publish, no connection to Firebase functions.");

//     const edition = await book.getEditionNumber(index + 1);
//     if (edition === undefined)
//         return `Couldn't find edition ${index} number to publish`;

//     const editionRef = edition.getRef();
//     if (editionRef === undefined) return `Couldn't find edition to publish`;

//     const publishEdition = httpsCallable<
//         { book: string; edition: string },
//         string
//     >(functions, 'publishEdition');

//     const result = await publishEdition({
//         book: book.getRef().id,
//         edition: editionRef.id,
//     });

//     return result.data;

//     // Update the edition's published status in the book.
//     // await updateBook(book.withEditionAsPublished(true, index));
// }
