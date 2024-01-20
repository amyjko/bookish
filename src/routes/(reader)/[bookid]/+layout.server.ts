import type { BookSpecification } from '$lib/models/book/Book';
import type { EditionSpecification } from '$lib/models/book/Edition';
import { error } from '@sveltejs/kit';
import admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

type BookMatch = { bookID: string | null; bookJSON: BookSpecification | null };
type EditionMatch = {
    editionID: string | null;
    editionJSON: EditionSpecification | null;
};

/** This load function loads a book in two phases: 1) the book metadata, resolving book vanity URLs, 2) then later streams all chapter text. */
/** @type {import('./$types').LayoutServerLoad} */
export async function load({ params }) {
    const bookName = params.bookid;
    const editionName = params.editionid;

    let bookJSON: BookSpecification | null = null;
    let bookID: string | null = null;

    // Resolve the book name. First check if there's a book with a matching subdomain.
    console.log(`Looking for book with name ${bookName}...`);
    ({ bookJSON, bookID } = await getBookByName(bookName));

    // If there wasn't a book with matching subdomain, see if it's a book ID.
    if (bookJSON === null) {
        console.log(
            `No matching vanity name. Looking for book with ID ${bookName}...`,
        );
        ({ bookJSON, bookID } = await getBookByID(bookName));
    }

    // If there's no book ID or book, bail with a 404 error
    if (bookID === null || bookJSON === null) {
        console.log(`No matching book.`);
        error(404, 'There is no book with this name or ID.');
    }

    // Search for edition ID.
    let editionID: string | null = null;
    let editionJSON: EditionSpecification | null = null;

    // If there's no edition name provided in the request, choose the latest published,
    // if there is one.
    if (editionName === undefined) {
        console.log(`No edition specified, getting latest published edition.`);
        ({ editionID, editionJSON } = await getLatestEdition(bookID, bookJSON));
    }
    // Otherwise, resolve the edition name provided.
    else {
        console.log(`Looking for book with edition number ${editionName}...`);
        ({ editionID, editionJSON } = await getEditionByID(
            editionName,
            bookID,
            bookJSON,
        ));
    }

    // No edition, no book. Bail.
    if (editionID === null || editionJSON === null) {
        console.log(`Didn't find edition, bailing.`);
        error(404, `Couldn't find edition ${editionName} for this book.`);
    }

    // Convert all document references to paths for serialization.
    // This breaks the type on the client side, but since we're
    // only using this to read books, not write them, it shouldn't
    // break anything.
    const book = bookJSON as unknown as any;
    for (const edition of book.editions) edition.ref = { id: edition.ref.id };
    const edition = editionJSON as unknown as any;
    edition.bookRef = { id: edition.bookRef.id };
    for (const chap of edition.chapters)
        if (chap.ref) chap.ref = { id: chap.ref.id };

    console.log(`Succeeded! Returning book.`);

    // Yay, success! We resolved a book. Return it's JSON.
    return {
        chapters: getChapters(bookID, editionID),
        meta: {
            bookID,
            editionID,
            book,
            edition,
            message: 'Found the book!',
        },
    };
}

async function getBookByName(bookName: string): Promise<BookMatch> {
    // Resolve the book name. First check if there's a book with a matching subdomain.
    const books = db.collection('books');
    const booksWithSubdomain = books.where('domain', '==', bookName);
    const booksWithSubmdomainResults = await booksWithSubdomain.get();
    if (booksWithSubmdomainResults.size > 0) {
        const bookDoc = booksWithSubmdomainResults.docs[0];
        const bookCandidate = bookDoc.data() as BookSpecification;
        // This should be redundant, since the query above should work. No real harm in checking though.
        if (bookCandidate.domain === bookName) {
            console.log(`Found book with matching vanity name.`);
            return {
                bookID: bookDoc.id,
                bookJSON: bookCandidate,
            };
        }
    }
    return {
        bookJSON: null,
        bookID: null,
    };
}

async function getBookByID(bookID: string): Promise<BookMatch> {
    const bookWithIDRef = db.doc(`books/${bookID}`);
    const bookWithIDResults = await bookWithIDRef.get();
    if (bookWithIDResults.exists) {
        console.log(`Found book with matching ID.`);
        return {
            bookID,
            bookJSON: bookWithIDResults.data() as BookSpecification,
        };
    } else
        return {
            bookID: null,
            bookJSON: null,
        };
}

async function getLatestEdition(
    bookID: string,
    bookJSON: BookSpecification,
): Promise<EditionMatch> {
    const editionID =
        bookJSON.editions.filter((ed) => ed.published !== null)[0]?.ref.id ??
        null;

    // If there is one, get the edition.
    if (editionID !== null) {
        const latestEditionRef = db.doc(
            `books/${bookID}/editions/${editionID}`,
        );
        const latestEditionDoc = await latestEditionRef.get();
        if (latestEditionDoc.exists) {
            console.log(`Found latest published edition.`);
            const candidateEdition =
                latestEditionDoc.data() as EditionSpecification;
            if (candidateEdition.published !== null) {
                return {
                    editionID,
                    editionJSON: candidateEdition,
                };
            } else
                console.log(
                    `Found latest published edition, but it wasn't published; data is out of sync.`,
                );
        } else {
            console.error(
                `Book's edition record is wrong, edition ${editionID} doesn't exist.`,
            );
        }
    }

    return {
        editionID: null,
        editionJSON: null,
    };
}

async function getEditionByID(
    editionName: string,
    bookID: string,
    bookJSON: BookSpecification,
): Promise<EditionMatch> {
    // Is it an edition number that's published?
    const editions = db.collection(`books/${bookID}/editions`);
    const editionsWithNumber = editions.where(
        'number',
        '==',
        parseInt(editionName),
    );
    const editionsWithNumberResults = await editionsWithNumber.get();
    if (editionsWithNumberResults.size > 0) {
        const editionDoc = editionsWithNumberResults.docs[0];
        const editionCandidate = editionDoc.data() as EditionSpecification;
        // Must be published to match.
        if (
            editionCandidate.number.toString() === editionName &&
            editionCandidate.published !== null
        ) {
            console.log(`Found published book with matching number.`);
            return {
                editionID: editionDoc.id,
                editionJSON: editionCandidate,
            };
        } else {
            console.error(`Found edition number, but it's not published.`);
        }
    } else {
        console.log(`Didn't find edition with number ${editionName}`);
    }

    // If it's not a number, see if it's an edition id that's published.
    console.log(`Looking for edition with id ${editionName}...`);
    const editionWithIDRef = db.doc(`books/${bookID}/editions/${editionName}`);
    const editionWithIDDoc = await editionWithIDRef.get();
    if (editionWithIDDoc.exists) {
        const editionCandidate =
            editionWithIDDoc.data() as EditionSpecification;
        if (editionCandidate.published !== null) {
            console.log(`Found published edition with matching ID.`);
            return {
                editionID: editionName,
                editionJSON: editionCandidate,
            };
        }
    }

    return {
        editionID: null,
        editionJSON: null,
    };
}

async function getChapters(
    bookID: string,
    editionID: string,
): Promise<Record<string, string>> {
    const chapters = await db
        .collection(`books/${bookID}/editions/${editionID}/chapters`)
        .get();

    const textByID: Record<string, string> = {};
    chapters.docs.forEach((doc) => {
        textByID[doc.id] = doc.data().text;
    });
    return textByID;
}
