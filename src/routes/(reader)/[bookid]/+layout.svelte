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
    import { doc } from 'firebase/firestore';
    import Error from '../+error.svelte';

    export let data: {
        bookID: string;
        book: BookSpecification;
        edition: EditionSpecification;
    };

    // A global store for the current book. It's at the root so the header can do breadcrumbs.
    let book = writable<Book | undefined>(undefined);
    setContext<BookStore>(BOOK, book);

    // A global store for the current edition. It's at the root so the header can do breadcrumbs.
    let edition = writable<EditionModel | undefined>(undefined);
    setContext<EditionStore>(EDITION, edition);

    // Set the context if we received the book edition.
    if (data?.book && data?.edition && data?.bookID) {
        book.set(Book.fromJSON(data.bookID, data.book));
        edition.set(EditionModel.fromJSON(undefined, data.edition));
    }
</script>

{#if $book && $edition}
    <Edition
        edition={$edition}
        base={`/${$book.getSubdomain() ?? $book.getID()}`}
    >
        <slot />
    </Edition>
{:else}
    <Error>Unable to retrieve this book.</Error>
{/if}
