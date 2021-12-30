import React, { useEffect } from 'react'
import { getBook } from "../../models/Database"

export default function Book(props) {

	useEffect(() => {
		getBook(props.match.params.id).then(book => {
			if(book === null)
				setBook(undefined)
			else {
				setBook(book)
            }
		})
	}, [])

    return <>

        <h1>The book will render here.</h1>

    </>
}