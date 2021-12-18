import { db } from "../firebase"
import { collection, getDocs, getDoc, doc, addDoc, query, where } from "firebase/firestore"

const booksCollection = collection(db, "books")

export const getBooks = async () => {

    try {
        const data = await getDocs(booksCollection);
        return data.docs.map((doc) => ({...doc.data(), id: doc.id}))
    } catch {
        return null
    }

}

export const getUserBooks = async (userID) => {

    try {
        const books = await getDocs(query(booksCollection, where("uids", "array-contains", userID)))
        return books.docs.map((doc) => ({...doc.data(), id: doc.id}))
    } catch(err) {
        console.error(err)
        return null
    }

}

export const getBook = async (bookID) => {

    try {
        const book = await getDoc(doc(db, "books", bookID))
        return book.data()
    } catch(err) {
        console.error(err)
        return null
    }

}

export const createBook = async (userID) => {

    const defaultBook = {
    	"title": "My new book",
	    "authors": [],
        "uids": [ userID ],
        "images": {
            "cover": null,
            "search": null,
            "media": null,
            "glossary": null,
            "references": null,
            "index": null,
            "unknown": null
        },
        "description": "What's your book about?",
        "acknowledgements": "Anyone to thank?",
        "chapters": [],
    	"tags": [],
        "revisions": [],
    	"license": "",
	    "sources": {},
	    "references": {},
    	"symbols": {},
    	"glossary": {}
    }

    try {
        const bookRef = await addDoc(booksCollection, defaultBook)
        return bookRef.id
    } catch(err) {
        return null
    }

}