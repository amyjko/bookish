<script lang="ts">
    import type { BookSpecification } from '$lib/models/book/Book';
    import type { EditionSpecification } from '$lib/models/book/Edition';
    import {
        BOOK,
        EDITION,
        type BookStore,
        type EditionStore,
    } from '$lib/components/page/Contexts';
    import Book from '$lib/models/book/Book';
    import Edition from '$lib/components/page/Edition.svelte';
    import { writable } from 'svelte/store';
    import { setContext } from 'svelte';
    import EditionModel from '$lib/models/book/Edition';
    import Error from '../+error.svelte';
    import Analytics from '$lib/components/page/Analytics.svelte';

    /** This is the data we load in +layout.sever.ts */
    export let data: {
        meta: {
            bookID: string;
            editionID: string;
            book: BookSpecification | null;
            edition: EditionSpecification;
            message: string;
        };
        chapters: Promise<Record<string, string>>;
    };

    const meta = data.meta;

    // A global store for the current book. It's at the root so the header can do breadcrumbs.
    let book = writable<Book | undefined>(undefined);
    setContext<BookStore>(BOOK, book);

    // A global store for the current edition. It's at the root so the header can do breadcrumbs.
    let edition = writable<EditionModel | undefined>(undefined);
    setContext<EditionStore>(EDITION, edition);

    // Set the context if we received the book.
    if (meta.book) {
        book.set(Book.fromJSON(meta.bookID, meta.book));
        edition.set(EditionModel.fromJSON(undefined, meta.edition));
    }

    // After the chapter text promise resolves, update the edition with the chapter text.
    // We stream this to load the table of contents faster.
    data.chapters.then((textByID) => {
        if ($edition !== undefined)
            edition.set(
                $edition.withChapterText(new Map(Object.entries(textByID))),
            );
    });
</script>

{#if $book && $edition}
    <!-- Do book analytics for the book's analytics ID, unless there is no id -->
    <Analytics gtagid={$edition.gtagid}></Analytics>

    <Edition
        edition={$edition}
        base={`/${$book.getSubdomain() ?? $book.getID()}`}
    >
        <slot />
    </Edition>
{:else}
    <Error>{meta.message}</Error>
{/if}
