import React from "react"
import { useState, useEffect } from "react"
import { BookSpecification } from "../../models/Book"
import { getBooks } from '../../models/Firestore'
import BookPreview from './BookPreview'

export default function Browse() {

	const [ books, setBooks ] = useState<BookSpecification[]>([])
	const [ loading, setLoading ] = useState<boolean>(true)
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
			error ? <div className=".bookish-app-alert">{error}</div> :
			loading ? <p>Loading books...</p> : 
				books.map((book) => { return <BookPreview key={book.bookID} book={book} write={false} />})
		}
	</>

}