import { db } from "./Firebase"
import { collection, getDocs, getDoc, setDoc, doc, addDoc, query, where } from "firebase/firestore"
import Book, { BookSpecification } from "./Book"

const booksCollection = !db ? undefined: collection(db, "books")

export const getBooks = async (): Promise<BookSpecification[] | null> => {

    if(!booksCollection)
        throw Error("Can't retrieve books, not connected to Firebase.")

    try {
        const data = await getDocs(booksCollection);
        return data.docs.map((doc) => ({...doc.data(), id: doc.id} as BookSpecification))
    } catch {
        return null
    }

}

export const getUserBooks = async (userID: string): Promise<BookSpecification[] | null> => {

    if(!booksCollection)
        throw Error("Can't retrieve user's books, not connected to Firebase.")

    try {
        const books = await getDocs(query(booksCollection, where("uids", "array-contains", userID)))
        return books.docs.map((doc) => ({...doc.data(), id: doc.id} as BookSpecification))
    } catch(err) {
        console.error(err)
        return null
    }

}

export const getBook = async (bookID: string): Promise<Book> => {

    if(!booksCollection || !db)
        throw Error("Can't retrieve book, not connected to Firebase.")

    const book = await getDoc(doc(db, "books", bookID))
    if(book.exists()) {
        const specification = book.data() as BookSpecification
        specification.id = bookID;
        return new Book(specification)
    }
    else
        console.error("" + bookID + " doesn't exist")

    throw Error("This book doesn't exist. Maybe the link is wrong?")

}

export const createBook = async (userID: string): Promise<string> => {

    if(!booksCollection)
        throw Error("Can't create book, not connected to Firebase.")

    // Make a new empty book, add this user, and store it.
    const newBook = new Book()
    newBook.addUserID(userID)
    const bookRef = await addDoc(booksCollection, newBook.toObject())
    return bookRef.id

}

export const updateBook = async (book: Book): Promise<void> => {

    if(!db)
        throw Error("Can't update book, not connected to Firebase.")

    // Get the object for the book so we can store it.
    const spec = book.toObject();
    const id = book.getID();

    // Make sure the given book has an ID
    if(!id)
        throw Error("Book given has no ID");

    // Try to update the book
    await setDoc(doc(db, "books", id), spec);

}