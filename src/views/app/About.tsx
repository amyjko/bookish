import React from 'react'

export default function About() {

    return <>
        <h1>Why Bookish?</h1>

        <div className="bookish-app-text">
            <p>
                Bookish is a simple platform for reading, writing, and publishing online books.
                It is a free service build and maintained by <a href="http://amyjko.com" target="_blank">Amy J. Ko</a>, a Professor at the <a href="https://www.washington.edu/" target="_blank">University of Washington</a> <a href="https://ischool.uw.edu" target="_blank">Information School</a>.
                She originally started building it to host the many textbooks she'd written to support her teaching, but eventually decided to invest in making it a platform that others could use too.
            </p>

            <p>
                Why not just use print, e-book formats, or innovative platforms like <a href="https://www.pubpub.org" target="_blank">PubPub</a>?
                Three reasons:
            </p>

            <ul>
                <li>
                    <strong>Simplicity</strong>. 
                    Publishing in all of the platforms above is complicated! 
                    Print is full gatekeeping and other digital platforms, despite being open, have complex tools and infrastructure. 
                    The goal of Bookish is to offer the simplest possible format for book writers who want to focus on writing.
                </li>
                <li>
                    <strong>Accessibility</strong>.
                    Most book publishing media produces book formats that are hard to use for people reliant on screen readers (tools that people who are blind, low-vision, and dyslexic often rely on to translate visual text onto a screen into spoken audio.)
                    The goal of Bookish is to produce books that are built for reading on any device with a web browser.
                    This includes an aspiration to explore creative new reading experiences that go beyond conventional reading experiences.
                    (Hence the name Book<em>ish</em>).
                </li>
                <li>
                    <strong>Beauty</strong>.
                    Typography matters. 
                    Print books can be beautiful, but are complex to make and inaccessible.
                    E-books and web-based books are often quite ugly and distracting.
                    Bookish strives to achieve beautiful typography that lets readers focus on reading.
                </li>
            </ul>

            <p>
                Do you have feedback about Bookish, or want to contribute?
                The project is free and open source <a href="https://github.com/amyjko/bookish" target="_blank">on GitHub</a>.
                Write <a href="mailto:ajko@uw.edu">Amy</a> if you'd like to collaborate, or <a href="https://github.com/amyjko/bookish/issues" target="_blank">submit an issue</a> or <a href="https://github.com/amyjko/bookish/pulls" target="_blank">pull request</a> directly.
            </p>
        </div>
    </>
}