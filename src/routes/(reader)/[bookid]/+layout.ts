import { error } from '@sveltejs/kit';
import type { BookSpecification } from '$lib/models/book/Book';
import type { LayoutLoadEvent } from './$types';

/** @type {import('./$types').LayoutLoad} */
export async function load({ fetch, params }: LayoutLoadEvent) {
    const bookID = params.bookid;
    const editionID = params.editionid;

    let data: { book: BookSpecification | null } | null = null;
    try {
        // Ask the public endpoint for the book edition.
        const response = await fetch(
            `/book/${bookID}${editionID ? `/${editionID}` : ''}`
        );
        data = await response.json();
    } catch (err) {
        throw error(404, { message: 'Unable to retrieve book.' });
    }

    if (data === null)
        throw error(404, { message: "This book doesn't exist." });

    return data;
}
