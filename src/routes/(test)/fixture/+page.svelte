<script lang="ts">
    import { setContext } from 'svelte';
    import { writable } from 'svelte/store';
    import type { DocumentReference } from 'firebase/firestore';
    import Book from '$lib/models/book/Book';
    import EditionModel from '$lib/models/book/Edition';
    import ChapterModel from '$lib/models/book/Chapter';
    import EditionView from '$lib/components/page/Edition.svelte';
    import ChapterView from '$lib/components/page/Chapter.svelte';
    import {
        BOOK,
        EDITION,
        type BookStore,
        type EditionStore,
    } from '$lib/components/page/Contexts';

    // A fake document reference; nothing on this page talks to Firestore.
    const bookRef = {
        id: 'fixturebook',
        path: 'books/fixturebook',
    } as unknown as DocumentReference;

    // A chapter with several footnotes so that the marginal layout system
    // has real work to do. Written in bookish markup.
    const chapterText = [
        'This is a fixture chapter for verifying that marginals are laid out correctly.{This is the first footnote, which should appear in the right margin on wide screens.} It contains several paragraphs and several footnotes.',
        'This second paragraph makes another claim.{This is the second footnote, which should be positioned below the first without overlapping it.} It exists to ensure that multiple marginals must be stacked vertically by the layout pass.',
        'A third paragraph adds a bit more text so the chapter has some height, letting the layout algorithm spread marginals out over a taller body of text before it runs out of room.',
        '`python\ndef hello():\n    print("hello marginalia")\nhello()\n`',
        'And a final paragraph with a final note.{This is the third footnote, far enough down the page that it should be positioned near its reference.}',
    ].join('\n\n');

    const chapter = ChapterModel.fromJSON({
        id: 'fixture',
        title: 'Fixture Chapter',
        authors: ['Test Author'],
        image: null,
        numbered: true,
        forthcoming: false,
        text: chapterText,
        uids: [],
    });

    const edition = new EditionModel(
        bookRef,
        undefined,
        [],
        'Fixture Book',
        ['Test Author'],
        1,
        '',
        Date.now(),
        {},
        undefined,
        'A fixture book for layout tests.',
        [chapter],
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

    const book = Book.fromJSON('fixturebook', {
        title: 'Fixture Book',
        authors: ['Test Author'],
        description: 'A fixture book for layout tests.',
        cover: null,
        published: true,
        editions: [],
        domain: null,
        uids: [],
        readuids: [],
    });

    // Mirror the contexts that (reader)/[bookid]/+layout.svelte sets.
    const bookStore = writable<Book | undefined>(book);
    setContext<BookStore>(BOOK, bookStore);
    const editionStore = writable<EditionModel | undefined>(edition);
    setContext<EditionStore>(EDITION, editionStore);
</script>

<EditionView {edition} base="/fixture">
    <ChapterView {chapter} />
</EditionView>
