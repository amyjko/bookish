import React, { useEffect, useState } from 'react'
import { getBook } from "../../models/Firestore"
import Book from "../../models/Book"

export default function Editor(props) {

	const [ book, setBook ] = useState();

	// When this mounts, get the book corresponding to the ID in the route
	useEffect(() => {
		getBook(props.match.params.id).then(book => setBook(new Book(book, [])))
	}, [])

    return <>
		{ 
			!book ? 
				<div className="bookish-app-error">Couldn't load the book.</div> :
		        <p>{JSON.stringify(book.toObject())}</p>
		}
    </>
}