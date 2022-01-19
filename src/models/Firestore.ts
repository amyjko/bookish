import { db } from "./Firebase"
import { collection, getDocs, getDoc, setDoc, doc, addDoc, query, where, limit } from "firebase/firestore"
import Book, { BookSpecification } from "./Book"


export const getBooks = async (): Promise<BookSpecification[] | null> => {

    if(!db)
        throw Error("Can't retrieve books, not connected to Firebase.")

    try {
        const data = await getDocs(collection(db, "books"));
        return data.docs.map((doc) => ({...doc.data(), bookID: doc.id} as BookSpecification))
    } catch {
        return null
    }

}

export const getUserBooks = async (userID: string): Promise<BookSpecification[] | null> => {

    if(!db)
        throw Error("Can't retrieve user's books, not connected to Firebase.")

    try {
        const books = await getDocs(query(collection(db, "books"), where("uids", "array-contains", userID)))
        return books.docs.map((doc) => ({...doc.data(), bookID: doc.id} as BookSpecification))
    } catch(err) {
        console.error(err)
        return null
    }

}

export const getFullBook = async (bookID: string): Promise<Book> => {

    if(!db)
        throw Error("Can't retrieve book, not connected to Firebase.")

    const book = await getDoc(doc(db, "books", bookID))
    if(book.exists()) {
        const content = await getBookContents(bookID)
        if(content) {
            const preview = book.data()
            const fullBook = Object.assign(content, preview)
            return new Book(fullBook as unknown as BookSpecification)
        } 
        else throw Error("Uh oh. Somehow there was no book content for this book. That should never happen.")
    }
    else throw Error("" + bookID + " doesn't exist")

}

const splitBook = (fullBook: BookSpecification): [ {}, {} ] => {

    const preview = (({ title, authors, description, uids }) => ({ title, authors, description, uids }))(fullBook)
    const { title, authors, description, uids, ... content } = fullBook
    return [ preview, content ]

}

const getBookContents = async (bookID: string): Promise<BookSpecification | undefined> => {

    if(!db)
        throw Error("Can't get book contents, not connected to Firebase.")

    const contents = await getDocs(query(collection(db, "bookContents"), where("bookID", "==", bookID), limit(1)))
    if(!contents.empty)
        return contents.docs[0].data() as BookSpecification
    else return undefined;

}

export const createBook = async (userID: string): Promise<string> => {

    if(!db)
        throw Error("Can't create book, not connected to Firebase.")

    // Make a new empty book
    const newBook = new Book()
    // Add the current user to the book
    newBook.addUserID(userID)
    // Add the book to the database
    const bookRef = await addDoc(collection(db, "books"), splitBook(newBook.toObject())[0])
    // Save the ID book ref to the contents so we have a reference back to the book.
    newBook.setBookID(bookRef.id)
    // Save the book contents
    await addDoc(collection(db, "bookContents"), splitBook(newBook.toObject())[1])

    // Return the book id
    return bookRef.id

}

export const updateBook = async (book: Book): Promise<void> => {

    if(!db)
        throw Error("Can't update book, not connected to Firebase.")

    // Get the object for the book so we can store it.
    const spec = book.toObject();
    const id = book.getBookID();

    // Make sure the given book has an ID
    if(!id)
        throw Error("Book given has no ID");

    // Split the book
    const [ preview, content ] = splitBook(spec)

    // Update the book's preview
    await setDoc(doc(db, "books", id), preview);

    // Update the book's content
    await setDoc(doc(db, "bookContents", id), content);

}