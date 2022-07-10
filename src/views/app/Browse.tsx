import React from "react"
import { useState, useEffect } from "react"
import { BookPreview as Preview } from "../../models/Book"
import { getPreviews } from '../../models/Firestore'
import BookPreview from './BookPreview'

export default function Browse() {

	const [ books, setBooks ] = useState<Preview[]>([])
	const [ loading, setLoading ] = useState<boolean>(true)
	const [ error, setError ] = useState('')

	// Get the books when the component loads.
	useEffect(() => {
		getPreviews().then(books => {
			setLoading(false) 
			if(books === null)
				setError("No books have been published.");
			else
				setBooks(books)
		})
	}, [])

	return <>

		<h1>Want to read?</h1>

		<p>Here are all of the books in the Bookish library.</p>
		{ 
			error ? <div className="bookish-app-alert">{error}</div> :
			loading ? <p>Loading books...</p> : 
				books.map((book, index) => { return <BookPreview key={`book${index}`} book={book} write={false} />})
		}
	</>

}