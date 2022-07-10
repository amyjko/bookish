import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import Edition, { EditionSpecification } from './book/Edition'
import { ChapterSpecification } from './book/Chapter'

let schema = require("../schemas/book.json");

// Returns a Promise that, given a URL to 
//   1) a to a valid "book.json" (see /src/schemas/book.json for a validity spec),
//   2) a "chapters" folder with .md files corresponding to the chapter IDs in the spec,
// resolves to a Book object with all of the book data.
// If any errors are encountered, throws an Error.
export default async function loadBookFromURL(url: string) {

    let specification: EditionSpecification | undefined = undefined

    // Fetch the JSON from the given URL
    return fetch(url + "book.json")
        // If there's a valid response, get the JSON
        .then(response => {

            // If it's a valid status, parse the text as JSON.
            if (response.status >= 200 && response.status <= 299)
                return response.json()
            // Otherwise, throw an error with the request failure.
            else
                throw Error(response.statusText)

        })
        // If the JSON doesn't parse...
        .catch(() => {
            throw Error("The book.json file that we received doesn't appear to be a JSON-formatted document.")
        })
        // Validate the specification and then load its chapters...
        .then((book) => {

            // Validate the book schema before we get started.
            const ajv = new Ajv({
                strictTuples: false
            });
            addFormats(ajv);

            // Did the specification have schema errors?
            // Initialize the book as null and set the errors.
            if (!ajv.validate(schema, book)) {
                throw Error(
                    "The book specification has validation errors" +
                    (ajv.errors ?
                        ": " + ajv.errors.map(error => url + error.instancePath + " " + error.message).join("\n") :
                        "."
                    )
                )
            }

            // Remember the book spec
            specification = book as unknown as EditionSpecification

            // Map all non-forthcoming chapters to a list of fetch promises
            return Promise.all(specification.chapters.filter((chapter: ChapterSpecification) => !chapter.forthcoming).map((chapter: ChapterSpecification) => 
                fetch(url + "chapters/" + chapter.id + ".md")
                    .then((response) => {

                        // If we got a reasonable response, process the chapter.
                        if(response.ok)
                            return response.text()
                        else
                            throw Error("Unable to load chapter named '" + chapter.id + "'. Make sure the chapter ID and chapter file name match.")

                    })
                    // Set the text field of the chapter object in the specification
                    .then((text) => {
                        chapter.text = text
                    })
                    // If there's an error, set chapter text to null.
                    .catch(() => {
                        chapter.text = undefined
                    })
            ))
        })
        // After all the chapter loading promises are done, make the book.
        .then(() => {

            // Construct a Book object given the spec and chapter text
            return new Edition(undefined, specification)

        })

}