import type { BookSpecification } from '$lib/models/book/Book';
import admin from 'firebase-admin';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ params, url }) {
    if (admin.apps.length === 0) admin.initializeApp();

    const bookID = params.bookid;
    const editionID = params.editionid;

    let data: { book: BookSpecification | null; message: string } | null = null;

    // Hit the cloud function endpoint that assembles the book data from Firestore.
    // This is cached and relatively fast.
    const path = `${url.origin}/book/${bookID}${
        editionID ? `/${editionID}` : ''
    }`;

    let text = '';
    let response: Response | undefined;
    try {
        // Ask the public endpoint for the book edition.
        response = await fetch(path);
        if (response.ok) {
            text = await response.text();
            data = JSON.parse(text);
        }
    } catch (err) {
        error(404, {
                    message: `Error retrieving book metadata at ${path}: ${response?.status} ${response?.statusText} ${text} ${err}`,
                });
    }

    if (data === null)
        error(404, {
                    message: `There doesn't seem to be a book here.`,
                });

    return data;
}
