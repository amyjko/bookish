import React from 'react'
import setTitle from './setTitle'

export default function Home() {

    setTitle("Bookish");

    return <>
        <h1>Bookish</h1>

        <div className="bookish-app-callout">Bookish is a platform for reading and writing simple, accessible, beautiful online books.</div>

        <div className="bookish-app-text">

            <p>
                Why not use print publishers, e-book platforms, or innovative platforms like <a href="https://www.pubpub.org" target="_blank">PubPub</a>?
            </p>

            <ol>
                <li>
                    <strong>Simplicity</strong>. 
                    Other platforms are complicated!
                    Print is full gatekeeping and other digital platforms, despite being open, have complex tools and infrastructure. 
                    Bookish tries to offer the simplest possible way to write and share, like a Google Docs for books.
                </li>
                <li>
                    <strong>Accessibility</strong>.
                    Most platforms produce books that are incompatible with screen readers.
                    Bookish ensures that books are readable on any device by any person with a standard web browser.
                </li>
                <li>
                    <strong>Beauty</strong>.
                    Typography matters. 
                    Print books can be beautiful, but are complex to make and inaccessible.
                    Many e-book and web-based book platforms are &emdash; less than beautiful.
                    Bookish strives for typography that focuses on reading, not navigating.
                </li>
            </ol>

            <p>
                Bookish is is built and maintained by <a href="http://amyjko.com" target="_blank">Amy J. Ko</a>, a Professor at the <a href="https://www.washington.edu/" target="_blank">University of Washington</a> <a href="https://ischool.uw.edu" target="_blank">Information School</a>.
                She originally built it to write books to support her teaching, but eventually decided to polish it enough for others to use.
            </p>

            <p>
                Do you have feedback about Bookish, or want to contribute?
                The project is free and open source <a href="https://github.com/amyjko/bookish" target="_blank">on GitHub</a>.
                Write <a href="mailto:ajko@uw.edu">Amy</a> if you'd like to collaborate, or <a href="https://github.com/amyjko/bookish/issues" target="_blank">submit an issue</a> or <a href="https://github.com/amyjko/bookish/pulls" target="_blank">pull request</a> directly.
            </p>
        </div>

    </>
}