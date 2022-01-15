import React, { useState, useEffect } from "react"
import { useAuth } from "./AuthContext"
import { createBook, getUserBooks } from '../../models/Firestore'
import BookPreview from './BookPreview'
import { Link } from "react-router-dom"
import { useNavigate } from "react-router-dom"
import { BookSpecification } from "../../models/Book"

export default function Dashboard() {

	const [ books, setBooks ] = useState<BookSpecification[]>([])
	const [ loading, setLoading ] = useState(true)
	const [ error, setError ] = useState('')
	const navigate = useNavigate()

	const { currentUser } = useAuth()

	function updateBooks() {
		if(currentUser)
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
		if(currentUser)
			createBook(currentUser.uid)
				.then(bookID => navigate("/write/" + bookID))
				.catch(error => { console.error(error); setError("Couldn't create a book: " + error)})

	}
	
	return <>

		<h1>Your books</h1>

		<p>
			Here are all of your books. Click to edit them.
		</p>

		<p>
			<button onClick={newBook}>Create book</button>
		</p>

		{ 
			error ? <div className="bookish-app-alert">{error}</div> :
			loading ? <p>Loading books...</p> : 
				books.map(book => <BookPreview key={book.id} book={book} write={true} />)
		}

	</>

}