import { db } from "./Firebase"
import { collection, getDocs, getDoc, setDoc, doc, addDoc, query, where, deleteDoc, DocumentReference } from "firebase/firestore"
import Book, { BookPreview, BookSpecification } from "./Book"
import Chapter, { ChapterContent } from "./Chapter"


export const getPreviews = async (): Promise<BookPreview[] | null> => {

    if(!db)
        throw Error("Can't retrieve previews, not connected to Firebase.")

    try {
        const data = await getDocs(collection(db, "previews"));
        return data.docs.map((doc) => ({...doc.data(), ref: doc.ref} as BookPreview))
    } catch {
        return null
    }

}

export const getUserBooks = async (userID: string): Promise<BookPreview[] | null> => {

    if(!db)
        throw Error("Can't retrieve user's books, not connected to Firebase.")

    try {
        const books = await getDocs(query(collection(db, "books"), where("uids", "array-contains", userID)))
        return books.docs.map((doc) => {
            const book = new Book(doc.ref, doc.data() as BookSpecification) as BookPreview
            return book
        })
    } catch(err) {
        console.error(err)
        return null
    }

}

export const getBook = async (bookID: string): Promise<Book> => {

    if(!db)
        throw Error("Can't retrieve book, not connected to Firebase.")

    const book = await getDoc(doc(db, "books", bookID))
    if(book.exists())
        return new Book(book.ref, book.data() as BookSpecification)
    
    throw Error("" + bookID + " doesn't exist")

}

export const createBook = async (userID: string): Promise<string> => {

    if(!db)
        throw Error("Can't create book, not connected to Firebase.")

    // Make a new empty book
    const newBook = new Book(undefined)
    // Add the current user to the book
    newBook.addUserID(userID)
    // Add the book to the database
    const bookRef = await addDoc(collection(db, "books"), newBook.toObject())

    // Note that we don't create a sub-collection of chapters here.
    // Firestore creates sub-collections automatically when documents are added.

    // Return the book id
    return bookRef.id

}

export const updateBook = async (book: Book): Promise<void> => {

    if(!db)
        throw Error("Can't update book, not connected to Firebase.")

    // Get the object for the book so we can store it.
    const spec = book.toObject();
    const bookRef = book.getRef();

    // Make sure the given book has an ID
    if(!bookRef)
        throw Error("Book given has no ID");

    // Update the book's preview
    await setDoc(doc(db, "books", bookRef.id), spec);

}

export const addChapter = async (ref: DocumentReference, chapter: ChapterContent): Promise<DocumentReference> => {

    if(!db)
        throw Error("Can't add chapter, not connected to Firebase.")

    return await addDoc(collection(db, `books/${ref.id}/chapters`), chapter)

}

export const removeChapter = async(chapter: Chapter): Promise<void> => {

    if(!db)
        throw Error("Can't add chapter, not connected to Firebase.")

    const ref = chapter.getRef()

    if(!ref)
        throw Error("Can't delete chapter, no bookID")

    await deleteDoc(ref);

}

export const getChapterText = async(chapter: DocumentReference): Promise<ChapterContent> => {

    if(!db)
        throw Error("Not connected to Firebase.")

    const text = await getDoc(chapter)
    if(!text.exists())
        throw Error("Chapter text does not exist.")

    return text.data() as ChapterContent

}

export const updateChapter = async(book: DocumentReference, chapter: DocumentReference, text: string): Promise<void> => {

    if(!db)
        throw Error("Can't update chapter, not connected to Firebase.")

    // Get the object for the book so we can store it.
    const spec = { text: text };

    // Update the book's preview
    await setDoc(doc(db, `books/${book.id}/chapters`, chapter.id), spec);

}