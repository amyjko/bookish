import { db } from "../firebase"
import { collection, getDocs, getDoc, doc, addDoc, query, where } from "firebase/firestore"
import Book, { BookSpecification } from "./Book"

const booksCollection = collection(db, "books")

export const getBooks = async (): Promise<BookSpecification[] | null> => {

    try {
        const data = await getDocs(booksCollection);
        return data.docs.map((doc) => ({...doc.data(), id: doc.id} as BookSpecification))
    } catch {
        return null
    }

}

export const getUserBooks = async (userID: string): Promise<BookSpecification[] | null> => {

    try {
        const books = await getDocs(query(booksCollection, where("uids", "array-contains", userID)))
        return books.docs.map((doc) => ({...doc.data(), id: doc.id} as BookSpecification))
    } catch(err) {
        console.error(err)
        return null
    }

}

export const getBook = async (bookID: string): Promise<Book> => {

    const book = await getDoc(doc(db, "books", bookID))
    if(book.exists())
        return new Book(book.data() as BookSpecification)
    else
        console.error("" + bookID + " doesn't exist")

    throw Error("This book doesn't exist. Maybe the link is wrong?")

}

export const createBook = async (userID: string): Promise<string> => {

    // Make a new empty book, add this user, and store it.
    const newBook = new Book()
    newBook.addUserID(userID)
    const bookRef = await addDoc(booksCollection, newBook.toObject())
    return bookRef.id

}