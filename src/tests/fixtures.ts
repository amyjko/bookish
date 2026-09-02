import Book from '$lib/models/book/Book';
import Edition from '$lib/models/book/Edition';
import Chapter from '$lib/models/book/Chapter';
import type { DocumentReference } from 'firebase/firestore';

export const bookRef = {
    id: 'testbook',
    path: 'books/testbook',
} as unknown as DocumentReference;
export const editionRef = {
    id: 'edition1',
    path: 'books/testbook/editions/edition1',
} as unknown as DocumentReference;

export function makeBook() {
    return Book.fromJSON('testbook', {
        title: 'Test Book',
        authors: [],
        description: '',
        cover: null,
        published: false,
        editions: [
            {
                ref: editionRef,
                summary: '',
                number: 1,
                published: null,
                editionuids: [],
                chapteruids: [],
            },
        ],
        domain: null,
        uids: ['someuser'],
        readuids: [],
    });
}

export function makeEdition() {
    return new Edition(
        bookRef,
        editionRef,
        ['someuser'],
        'Test Book',
        [],
        1,
        '',
        null,
        {},
        undefined,
        '',
        [
            Chapter.fromJSON({
                ref: { id: 'chapter1' } as unknown as DocumentReference,
                id: 'chapter1',
                title: 'Chapter One',
                authors: [],
                image: null,
                numbered: true,
                forthcoming: false,
                text: 'Some chapter text.',
                uids: [],
            }),
        ],
        'All rights reserved.',
        '',
        [],
        {},
        {},
        {},
        {},
        null,
        null,
        {},
        null,
    );
}
