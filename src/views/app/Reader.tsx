import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getBookIDFromBookName, loadBookFromFirestore } from "../../models/Firestore"
import Edition from '../page/Edition'
import Loading from '../page/Loading'
import EditionModel from '../../models/book/Edition'
import Book from '../../models/book/Book'
import { getSubdomain } from '../util/getSubdomain'

export default function Reader() {

    const [ , setBook ] = useState<Book | undefined>(undefined);
	const [ edition, setEdition ] = useState<EditionModel | null>(null)
    const [ error, setError ] = useState<Error | null>(null)
    const { bookid, editionid, bookname } = useParams()

    const subdomain = getSubdomain();
    const possibleBookname = subdomain ?? bookname;

    function initializeBook(newBook: Book) {

        setBook(newBook);
        const editionNumber = editionid === undefined ? undefined : parseInt(editionid);
        const edition = editionNumber === undefined || isNaN(editionNumber) ? newBook.getLatestPublishedEdition() : newBook.getEditionNumber(editionNumber);
        if(edition)
            edition
                .then(b => setEdition(b))
                .catch((error) => setError(error));
        else
            setError(Error("This book has no published editions."));

    }
    
	// When this mounts, get the book corresponding to the ID in the route
	useEffect(() => {
        if(bookid !== undefined)
            loadBookFromFirestore(bookid)
                .then(book => initializeBook(book))
                .catch((error => setError(error)))
        else if(possibleBookname !== undefined) {
            getBookIDFromBookName(possibleBookname)
                .then(bookid => loadBookFromFirestore(bookid)
                    .then(book => initializeBook(book))
                    .catch((error => setError(error)))
                )
                .catch(error => setError(error));
        }
        else
            setError(Error("There's no book by this name."))
	}, [])

    return  error !== null ? <div className="bookish-app-alert">{error.message}</div> :
            edition === null ? <Loading/> :
                <Edition edition={edition} base={
                    possibleBookname === undefined ? `/read/${bookid}/${edition.getEditionNumber()}` : 
                    subdomain !== undefined ? "":
                    `/${bookname}`
                } />

}