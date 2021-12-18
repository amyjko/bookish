import React, { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Button, Alert } from "react-bootstrap"
import { createBook, getUserBooks } from '../models/Database'
import BookPreview from './BookPreview'
import { Link } from "react-router-dom"
import { useHistory } from "react-router-dom"
import { Breadcrumb } from 'react-bootstrap'

export default function Dashboard() {

	const [ books, setBooks ] = useState([])
	const [ loading, setLoading ] = useState(true)
	const [ error, setError ] = useState('')
	const history = useHistory()

	const { currentUser } = useAuth()

	function updateBooks() {
		getUserBooks(currentUser.uid).then(books => {
			setLoading(false) 
			if(books === null)
				setError("Unable to load books");
			else
				setBooks(books)
		})
	}

	// Get the books when the component loads.
	useEffect(() => {
		updateBooks()
	}, [])

	function newBook() {

		// Make the book, then go to its page
		const bookID = 
			createBook(currentUser.uid)
				.then(bookID => history.push("/book/" + bookID))

	}
	
	return <>

		<Breadcrumb>
            <Breadcrumb.Item active>Dashboard</Breadcrumb.Item>
        </Breadcrumb>

		<h1>Your Books</h1>

		<p>
			Here are all of your books. Click to edit them.
		</p>

		<p>
			<Button onClick={newBook}>Create book</Button>
		</p>

		{ 
			error ? <Alert variant="danger">{error}</Alert> :
			loading ? <p>Loading books...</p> : 
				books.map(book => <Link key={book.id} to={/book/ + book.id}><BookPreview book={book}/></Link>)
		}

	</>

}