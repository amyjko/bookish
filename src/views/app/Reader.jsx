import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getBook } from "../../models/Firestore"
import Book from '../page/Book'
import Loading from '../page/Loading'

export default function Reader(props) {

	const [ book, setBook ] = useState(null)
    const [ error, setError ] = useState(null)
    const { id } = useParams()

	// When this mounts, get the book corresponding to the ID in the route
	useEffect(() => {
		getBook(id)
            .then(b => setBook(b))
            .catch((error) => setError(error))
	}, [])

    return  error !== null ? <div className="bookish-app-alert">{error.message}</div> :
            book === null ? <Loading/> :
                <Book book={book} base={"/read/" + id} />

}