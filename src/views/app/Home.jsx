import { Link } from 'react-router-dom'
import React from 'react'

export default function Home() {

    return <>
        <h1>Welcome to <strong>Bookish</strong></h1>
        <p>Where books are bound for the web.</p>

        <p><Link to="/read">Read a book</Link>.</p>
        <p><Link to="/write">Write a book</Link>.</p>
    </>
}