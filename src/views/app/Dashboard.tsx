import React, { useState, useEffect } from "react"
import { useAuth } from "./AuthContext"
import { createBookInFirestore, loadUsersBooksFromFirestore } from '../../models/Firestore'
import BookPreview from './BookPreview'
import { useNavigate } from "react-router-dom"
import Book from "../../models/book/Book"
import setTitle from "./setTitle"

export default function Dashboard() {

	setTitle("Bookish — Write");

	const [ books, setBooks ] = useState<Book[]>([])
	const [ loading, setLoading ] = useState(true)
	const [ error, setError ] = useState('')
	const navigate = useNavigate()

	const { currentUser } = useAuth()

	function updateBooks() {
		if(currentUser)
			loadUsersBooksFromFirestore(currentUser.uid).then(books => {
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
			createBookInFirestore(currentUser.uid)
				.then(bookID => navigate("/write/" + bookID))
				.catch(error => { console.error(error); setError("Couldn't create a book: " + error)})

	}
	
	return <>

		<h1>Write</h1>

		<p>
			<button onClick={newBook}>Create book</button>
		</p>

		<p>
			Books you can edit.
		</p>

		{ 
			error ? <div className="bookish-app-alert">{error}</div> :
			loading ? <p>Loading books...</p> : 
			books.length === 0 ? <p>You don't have have any books.</p> :
				books.map((book, index) => <BookPreview key={`book${index}`} book={book} write={true} />)
		}

	</>

}