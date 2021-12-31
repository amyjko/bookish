import Ajv from 'ajv';
import Book from './Book'

let schema = require("../schemas/book.json");

// Returns a Promise that, given a URL to 
//   1) a to a valid "book.json" (see /src/schemas/book.json for a validity spec),
//   2) a "chapters" folder with .md files corresponding to the chapter IDs in the spec,
// resolves to a Book object with all of the book data.
// If any errors are encountered, throws an Error.
async function loadBookFromURL(url) {

    let specification = null
    let chapters = {}

    // Fetch the JSON from the given URL
    return fetch(url + "/book.json")
        // If there's a valid response, get the JSON
        .then(response => {

            // If it's a valid status, parse the text as JSON.
            if (response.status >= 200 && response.status <= 299)
                return response.json()
            // Otherwise, throw an error with the request failure.
            else
                throw Error(response.statusText)

        })
        .catch(error => {
            throw Error("There's a JSON syntax error in the book specification.")
        })
        // After getting the JSON, verify that it's a valid book specification.
        .then(book => {

            // Validate the book schema before we get started.
            const ajv = new Ajv();

            // Did the specification have schema errors?
            // Initialize the book as null and set the errors.
            if (!ajv.validate(schema, book)) {
                throw Error(
                    "The book has one or more error validation errors: " +
                    ajv.errors.map(error => url + error.dataPath + " " + error.message).join("\n")
                )
            }

            // Remember the book spec
            specification = book

            // Map all non-forthcoming chapters to a list of fetch promises
            return Promise.all(book.chapters.filter(chapter => !chapter.forthcoming).map(chapter => 
                fetch(url + "/chapters/" + chapter.id + ".md")
                    .then((response) => {

                        // If we got a reasonable response, process the chapter.
                        if(response.ok)
                            return response.text()
                        else
                            throw Error("Unable to load chapter named '" + chapter.id + "'. Make sure the chapter ID and chapter file name match.")

                    })
                    .then((text) => {
                        chapters[chapter.id] = text
                    })
            ))
        })
        .then(() => {

            // Construct a Book object given the spec and chapter text
            return new Book(specification, chapters)

        })

}

export { loadBookFromURL }