import React, { useEffect,  useState, useRef } from 'react'
import { Breadcrumb, Form, Button, Row, FloatingLabel } from 'react-bootstrap'
import { Link } from 'react-router-dom'

import { getBook } from "../models/Database"

export default function Book(props) {

    const [ book, setBook ] = useState(null)
    const titleRef = useRef()
    const descriptionRef = useRef()
    const acksRef = useRef()
    const [ titleDescriptionValid, setTitleDescriptionValid ] = useState(undefined)
    const [ authorsAcksValid, setAuthorsAcksValid ] = useState(undefined)

	useEffect(() => {
		getBook(props.match.params.id).then(book => {
			if(book === null)
				setBook(undefined)
			else {
				setBook(book)
            }
		})
	}, [])

    function handleTitleDescriptionSave() {
    }

    function handleTitleDescriptionChange() {
        setTitleDescriptionValid(
            titleRef.current && titleRef.current.value !== book.title ||
            descriptionRef.current && descriptionRef.current.value !== book.description ||
            acksRef.current && acksRef.current.value !== book.acknowledgements
        )
    }

    function handleAuthorsAcksSave() {
    }

    function handleAuthorsAcksChange() {
        setAuthorsAcksValid(
            acksRef.current && acksRef.current.value !== book.acknowledgements
        )
    }

    return <>

        <Breadcrumb>
            <Breadcrumb.Item linkAs={Link} linkProps={{to: "/dashboard"}}>Dashboard</Breadcrumb.Item>
            <Breadcrumb.Item active>Book</Breadcrumb.Item>
        </Breadcrumb>

        <h1>Book</h1>

        <p>
            Edit your book's metadata below.
        </p>

        {
            book === null ? <p>Loading book</p> :
            book === undefined ? <p>Couldn't load book</p> :
                <>

                    <h2>Title and Description</h2>

                    <p>These appear at the very top of the book's cover page.</p>

                    <Form className="mb-3" onSubmit={handleTitleDescriptionSave}>
                        <FloatingLabel label="Title" className="mt-3 mb-3">
                            <Form.Control type="text" placeholder="Title" defaultValue={book.title} ref={titleRef} required onChange={handleTitleDescriptionChange}></Form.Control>
                        </FloatingLabel>
                        <FloatingLabel label="Description (Bookish markup)" className="mt-3 mb-3">
                            <Form.Control as="textarea" placeholder="Describe your book for readers" style={{ height: "100px" }} defaultValue={book.description} ref={descriptionRef} onChange={handleTitleDescriptionChange}></Form.Control>
                        </FloatingLabel>
                        <Button variant="primary" type="submit" disabled={!titleDescriptionValid}>Save</Button>
                    </Form>

                    <h2>Authors and Acknowledgements</h2>

                    <p>Authors appear below the title and acknowledgements below the description.</p>

                    <Form className="mb-3" onSubmit={handleAuthorsAcksSave}>
                        {
                            book.authors.map(author => {

                            })
                        }

                        <FloatingLabel label="Acknowledgements (Bookish markup)" className="mt-3 mb-3">
                            <Form.Control as="textarea" placeholder="Who would you like to thank?" style={{ height: "100px" }} defaultValue={book.acknowledgements} ref={acksRef} onChange={handleAuthorsAcksChange}></Form.Control>
                        </FloatingLabel>
                        <Button variant="primary" type="submit" disabled={!authorsAcksValid}>Save</Button>
                    </Form>

                    <h2>Chapters</h2>

                    <h2>License</h2>

                    <p>
                        Tell your readers what rights you reserve. In the U.S, everything is copyrighted by default unless an author gives explicit rights to others.
                    </p>

                    <h2>References</h2>

                    <p>
                        Define references here, give them an identifier (e.g., <code>wilkins21</code>), and you can refer to them throughout the book by wrapping text in <code>Seminal work on frogs&lt;wilkins21&gt;</code>
                        Bookish will annotate references in the margins, generate a reference list at the end of each chapter, and create a reference list for the whole book.
                    </p>

                    <h2>Glossary</h2>

                    <p>
                        Define terms here, give them an identifier (e.g., <code>fancy</code>), and you can refer to them throughout the book by wrapping text in <code>~fancy phrase~fancy</code>.
                        Bookish will place glossary definitions in the margins and create a glossary for the book.
                    </p>

                    <h2>Symbols</h2>

                    <p>
                        Do you have text that appears in multiple places in your book (e.g., recurring headers, links, or phrases)?
                        Give it a <code>name</code> and you can refer to it in chapters as <code>@name</code>.
                        By writing the text once, and reusing it everywhere you need, you can save writing time, ensure consistency, and make it easier to make revisions.
                    </p>

                </>
        }

        {/* Need editors for all of the types below */}
    	{
            /* "title": "My new book",
            "authors": [],
            "uids": [ userID ],
            "images": {
                "cover": null,
                "search": null,
                "media": null,
                "glossary": null,
                "references": null,
                "index": null,
                "unknown": null
            },
            "description": "What's your book about?",
            "acknowledgements": "Anyone to thank?",
            "chapters": [],
            "tags": [],
            "revisions": [],
            "license": "",
            "sources": {},
            "references": {},
            "symbols": {},
            "glossary": {} */
        }

    </>
}