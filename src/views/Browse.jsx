import React from "react"
import { useState, useEffect } from "react"
import { Alert } from 'react-bootstrap'
import { getBooks } from '../models/Database'
import BookPreview from './BookPreview'
import { Breadcrumb } from 'react-bootstrap'

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

		<Breadcrumb>
            <Breadcrumb.Item active>Books</Breadcrumb.Item>
        </Breadcrumb>

		<h1>The Bookish Library</h1>

		<p>Here are all of the books in the Bookish library.</p>
		{ 
			error ? <Alert variant="danger">{error}</Alert> :
			loading ? <p>Loading books...</p> : 
				books.map((book) => { return <BookPreview key={book.id} book={book} />})
		}
	</>

}