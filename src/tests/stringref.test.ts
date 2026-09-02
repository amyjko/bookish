import { expect, test } from 'vitest';
import Edition from '$lib/models/book/Edition';
import { bookRef, editionRef } from './fixtures';
import Chapter from '$lib/models/book/Chapter';

// Reproduce the "e is not iterable" crash with a legacy string-form reference.
test('an edition with a string-form reference can render its parts', () => {
    const edition = new Edition(
        bookRef,
        editionRef,
        ['u'],
        'T',
        [],
        1,
        '',
        null,
        {},
        undefined,
        '',
        [
            Chapter.fromJSON({
                id: 'c',
                title: 'C',
                authors: [],
                image: null,
                numbered: true,
                forthcoming: false,
                text: 'Hi.<cite1>',
                uids: [],
            }),
        ],
        '',
        '',
        [],
        {},
        { cite1: 'Author, A. (2020). A cited work.' },
        {},
        {},
        null,
        null,
        {},
        null,
    );
    // Exercise the paths the chapter editor touches.
    const ref = edition.getReference('cite1');
    expect(ref).toBeDefined();
    const chapter = edition.getChapter('c');
    const ast = chapter?.getAST(edition);
    expect(ast).toBeDefined();
    // Chapter.svelte computes citations from the AST:
    const citations = ast?.getCitations();
    expect(citations).toBeDefined();

    // Copy-on-write operations re-run reference normalization in the
    // constructor; string-origin references (now FormatNodes) must survive.
    const revised = edition.withChapters(edition.chapters);
    expect(revised.getReference('cite1')).toBeDefined();
});
