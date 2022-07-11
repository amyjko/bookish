import { db } from "./Firebase"
import { collection, getDocs, getDoc, setDoc, doc, addDoc, query, where, deleteDoc, DocumentReference } from "firebase/firestore"
import Edition, { EditionSpecification } from "./book/Edition"
import Book, { BookSpecification } from "./book/Book"
import Chapter, { ChapterContent } from "./book/Chapter"


export const loadBooksFromFirestore = async (): Promise<Book[] | null> => {

    if(!db)
        throw Error("Can't retrieve books, not connected to Firebase.")

    try {
        const data = await getDocs(collection(db, "books"));
        return data.docs.map(doc => new Book(doc.ref, doc.data() as BookSpecification))
    } catch {
        return null
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

    // Make a new empty edition.
    const newEdition = new Edition(undefined, undefined);
    // Add the current user to the book
    newEdition.addUserID(userID)
    // Add the book to the editions collection
    const editionRef = await addDoc(collection(db, "editions"), newEdition.toObject())
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
    const bookRef = await addDoc(collection(db, "books"), newBook)

    // Return the book id
    return bookRef.id

}

export const addDraftInFirestore = async (book: Book): Promise<void> => {

    if(!db)
        throw Error("Can't publish draft, no Firebase connection.");

    // Get the latest draft.
    const latestDraft = await book.getDraft();
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
    })

    book.setRevisions(revisions);

    // Return the revised Book for viewing
    updateBookInFirestore(book);

}

export const publishDraftInFirestore = async (book: Book, index: number, published: boolean): Promise<void> => {

    if(!db)
        throw Error("Can't publish draft, no Firebase connection.");

    // Update the edition's published status.
    book.setPublished(published, index);
    
    // Update the book with the draft's latest latest metadata.
    const draft = await book.getLatestEdition();
    if(draft) {
        book.setTitle(draft.getTitle());
        book.setCover(draft.getImage("cover") ?? null);
        book.setAuthors(draft.getAuthors());
        book.setDescription(draft.getDescription());
    }

    // Return the revised Book for viewing
    updateBookInFirestore(book);

}

export const updateEditionInFirestore = async (edition: Edition): Promise<void> => {

    if(!db)
        throw Error("Can't update edition, not connected to Firebase.")

    // Get the object for the book so we can store it.
    const spec = edition.toObject();
    const editionRef = edition.getRef();

    // Make sure the given book has an ID
    if(!editionRef)
        throw Error("Book given has no ID");

    // Update the book's preview
    await setDoc(doc(db, "editions", editionRef.id), spec);

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
        throw Error("Can't delete chapter, no bookID")

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