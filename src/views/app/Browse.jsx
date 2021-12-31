import React from "react"
import { useState, useEffect } from "react"
import { getBooks } from '../../models/Firestore'
import BookPreview from './BookPreview'

export default function Browse() {

	const [ books, setBooks ] = useState([])
	const [ loading, setLoading ] = useState(true)
	const [ error, setError ] = useState('')

	// Get the books when the component loads.
	useEffect(() => {
		getBooks().then(books => {
			setLoading(false) 
			if(books === null)
				setError("Unable to load books");
			else
				setBooks(books)
		})
	}, [])

	return <>

		<h1>Want to read?</h1>

		<p>Here are all of the books in the Bookish library.</p>
		{ 
			error ? <Alert variant="danger">{error}</Alert> :
			loading ? <p>Loading books...</p> : 
				books.map((book) => { return <BookPreview key={book.id} book={book} />})
		}
	</>

}