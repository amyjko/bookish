import React, { useEffect, useState } from 'react'
import { useParams } from "react-router-dom"
import { getEdition } from "../../models/Firestore"
import Book from "../page/Book"
import Loading from "../page/Loading"
import BookModel from "../../models/book/Edition"

export default function Editor() {

	const [ book, setBook ] = useState<BookModel | null>(null)
    const [ error, setError ] = useState<Error | null>(null)
    const { id } = useParams()

	// When this mounts, get the book corresponding to the ID in the route
	useEffect(() => {
        if(id)
            getEdition(id)
                .then(b => setBook(b))
                .catch((error) => setError(error))
        else
            setError(Error("No book specified in URL."))
	}, [])

    return  error !== null ? <div className="bookish-app-alert">{error.message}</div> :
            book === null ? <Loading/> :
                <Book book={book} base={"/write/" + id} editable={true} />

}