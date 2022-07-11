import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { loadBookFromFirestore } from "../../models/Firestore"
import Edition from '../page/Edition'
import Loading from '../page/Loading'
import EditionModel from '../../models/book/Edition'
import Book from '../../models/book/Book'

export default function Reader() {

    const [ , setBook ] = useState<Book | undefined>(undefined);
	const [ edition, setEdition ] = useState<EditionModel | null>(null)
    const [ error, setError ] = useState<Error | null>(null)
    const { id } = useParams()

    function initializeBook(newBook: Book) {

        setBook(newBook);
        const draft = newBook.getLatestEdition();
        if(draft)
            draft
                .then(b => setEdition(b))
                .catch((error) => setError(error));
        else
            setError(Error("This book has no published editions."));

    }
    
	// When this mounts, get the book corresponding to the ID in the route
	useEffect(() => {
        if(id)
            loadBookFromFirestore(id)
                .then(book => initializeBook(book))
                .catch((error => setError(error)))
        else
            setError(Error("No book specified in URL."))
	}, [])

    return  error !== null ? <div className="bookish-app-alert">{error.message}</div> :
            edition === null ? <Loading/> :
                <Edition edition={edition} base={"/read/" + id} />

}