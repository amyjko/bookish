import { db } from "./Firebase"
import { collection, getDocs, getDoc, setDoc, doc, addDoc, query, where, deleteDoc, DocumentReference } from "firebase/firestore"
import Edition, { EditionSpecification } from "./book/Edition"
import Book, { BookSpecification } from "./book/Book"
import Chapter, { ChapterContent } from "./book/Chapter"


export const loadPublishedBooksFromFirestore = async (): Promise<Book[]> => {

    if(!db)
        throw Error("Can't retrieve books, not connected to the database.")

    try {
        const data = await getDocs(collection(db, "books"));
        return data.docs.map(doc => new Book(doc.ref, doc.data() as BookSpecification)).filter(book => book.hasPublishedEdition())
    } catch {
        throw Error("Couldn't load books, problem reading from the database.")
    }

}

export const loadUsersBooksFromFirestore = async (userID: string): Promise<Book[] | null> => {

    if(!db)
        throw Error("Can't retrieve user's books, not connected to Firebase.")

    try {
        const books = await getDocs(query(collection(db, "books"), where("uids", "array-contains", userID)))
        return books.docs.map(doc => new Book(doc.ref, doc.data() as BookSpecification))
    } catch(err) {
        console.error(err)
        return null
    }

}

export const loadBookFromFirestore = async (bookID: string): Promise<Book> => {

    if(!db)
        throw Error("Can't retrieve user's books, not connected to Firebase.")

    const bookRef = doc(db, "books", bookID);
    const book = await getDoc(bookRef);
    if(!book.exists())
        throw new Error(`Couldn't find book ${bookID}`);

    return new Book(bookRef, book.data() as BookSpecification);

}

export const loadEditionFromFirestore = async (book: Book, editionID: string): Promise<Edition> => {

    if(!db)
        throw Error("Can't retrieve edition, not connected to Firebase.")

    const edition = await getDoc(doc(db, "editions", editionID))
    if(edition.exists())
        return new Edition(book, edition.ref, edition.data() as EditionSpecification)
    else
        throw Error("" + editionID + " doesn't exist")

}

export const createBookInFirestore = async (userID: string): Promise<string> => {

    if(!db)
        throw Error("Can't create book, not connected to Firebase.")

    // Make a new empty edition with a single chapter.
    const newEdition = new Edition();

    // Add the current user to the book
    newEdition.addUserID(userID)

    // Add the book to the editions collection
    const editionRef = await addDoc(collection(db, "editions"), newEdition.toObject());
    newEdition.setRef(editionRef);

    // Add a new chapter to the edition and update it in the database.
    await newEdition.addChapter();
    await updateEditionInFirestore(newEdition);

    // Note that we don't create a sub-collection of chapters here.
    // Firestore creates sub-collections automatically when documents are added.

    // Create a new book with the draft first edition and the user ID.
    const newBook: BookSpecification = {
        title: "",
        authors: [],
        description: "",
        cover: null,
        revisions: [
            {
                ref: editionRef,
                time: Date.now(),
                summary: "",
                published: false
            }
        ],
        uids: [ userID ]
    }

    // Create the book
    const bookRef = await addDoc(collection(db, "books"), newBook);

    // Return the book id
    return bookRef.id

}

export const addDraftInFirestore = async (book: Book): Promise<void> => {

    if(!db)
        throw Error("Can't publish draft, no Firebase connection.");

    // Get the latest draft.
    const latestDraft = await book.getDraftEdition();
    if(latestDraft === undefined) return;

    // Create a copy of the existing draft as a new edition
    const newDraft = await addDoc(collection(db, "editions"), latestDraft.toObject());

    // Put the new edition in the book.
    const revisions = book.getRevisions();
    revisions.unshift({
        ref: newDraft,
        time: Date.now(),
        summary: "",
        published: false
    });

    book.setRevisions(revisions);

    // Return the revised Book for viewing
    updateBookInFirestore(book);

}

export const publishDraftInFirestore = async (book: Book, index: number, published: boolean): Promise<void> => {

    if(!db)
        throw Error("Can't publish draft, no Firebase connection.");

    // Update the edition's published status.
    book.setPublished(published, index);
    
    // Update the book with the latest published edition's metadata.
    const draft = await book.getLatestPublishedEdition();
    if(draft) book.updateMetadataFromEdition(draft);

    // Return the revised Book for viewing
    updateBookInFirestore(book);

}

export const updateEditionInFirestore = async (edition: Edition): Promise<void> => {

    if(!db)
        throw Error("Can't update edition, not connected to Firebase.")

    // Get the object for the edition so we can store it.
    const spec = edition.toObject();
    const editionRef = edition.getRef();

    // Make sure the given edition has a database reference ID
    if(!editionRef)
        throw Error("Book given has no ID");

    // Update the edition's document.
    await setDoc(doc(db, "editions", editionRef.id), spec);

    // Get the book of the editiion, and if the edition updated is the latest edition,
    // update the book's cache of title, cover, authors, and description.
    if(edition.book !== undefined && edition.isLatestPublishedEdition())
        edition.book.updateMetadataFromEdition(edition);

}

export const deleteEditionInFirestore = async (book: Book, index: number): Promise<void> => {

    if(!db)
        throw Error("Can't update edition, not connected to Firebase.")

    const revisions = book.getRevisions();
    if(index < 0 || index >= revisions.length) return;

    await deleteDoc(revisions[index].ref);

    revisions.splice(index, 1);
    book.setRevisions(revisions);

    await updateBookInFirestore(book);

}

export const updateBookInFirestore = async (book: Book): Promise<void> => {

    if(!db)
        throw Error("Can't update boo, not connected to Firebase.")

    await setDoc(doc(db, "books", book.getRefID()), book.toObject());

}

export const addChapterInFirestore = async (edition: DocumentReference, chapter: ChapterContent): Promise<DocumentReference> => {

    if(!db)
        throw Error("Can't add chapter, not connected to Firebase.")

    return await addDoc(collection(db, `editions/${edition.id}/chapters`), chapter)

}

export const removeChapterFromEditionInFirestore = async(chapter: Chapter): Promise<void> => {

    if(!db)
        throw Error("Can't add chapter, not connected to Firebase.")

    const ref = chapter.getRef()

    if(!ref)
        throw Error("Can't delete chapter, it doesn't have a document ID.")

    await deleteDoc(ref);

}

export const loadChapterTextFromFirestore = async(chapter: DocumentReference): Promise<ChapterContent> => {

    if(!db)
        throw Error("Not connected to Firebase.")

    const text = await getDoc(chapter)
    if(!text.exists())
        throw Error("Chapter text does not exist.")

    return text.data() as ChapterContent

}

export const updateChapterTextInFirestore = async(edition: DocumentReference, chapter: DocumentReference, text: string): Promise<void> => {

    if(!db)
        throw Error("Can't update chapter, not connected to Firebase.")

    // Get the object for the book so we can store it.
    const spec = { text: text };

    // Update the book's preview
    await setDoc(doc(db, `editions/${edition.id}/chapters`, chapter.id), spec);

}

export const subdomainIsAvailable = async (subdomain: string, book: Book): Promise<boolean> => {

    if(!db)
        throw Error("Not connected to Firebase.");

    const matches = await getDocs(query(collection(db, "books"), where("domain", "==", subdomain)));

    return matches.empty || matches.docs[0].id === book.getRefID();

}

export const getBookIDFromBookName = async (subdomain: string): Promise<string> => {

    if(!db)
        throw Error("Can't find book ID from URL, not connected to Firebase.")

    const matches = await getDocs(query(collection(db, "books"), where("domain", "==", subdomain)));

    if(!matches.empty)
        return matches.docs[0].id;

    throw Error("No book by this name.");

}