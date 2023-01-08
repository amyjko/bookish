<script lang="ts">
    import type EditionModel from '$lib/models/book/Edition';
    import type Book from '$lib/models/book/Book';
    import Loading from '$lib/components/page/Loading.svelte';
    import Edition from '$lib/components/page/Edition.svelte';
    import Feedback from '$lib/components/app/Feedback.svelte';
    import { getBook, getEdition } from '$lib/components/page/Contexts';
    import { onDestroy } from 'svelte';

    export let data:
        | { book: Book; edition: EditionModel; latest: boolean }
        | null
        | undefined = undefined;

    let book = getBook();
    let edition = getEdition();

    // Update the global stores to the book and edition received.
    $: edition.set(data ? data.edition : undefined);
    $: book.set(data ? data.book : undefined);
    // When unmounted, unset the stores — no longer viewing a book.
    onDestroy(() => {
        edition.set(undefined);
        book.set(undefined);
    });
</script>

{#if data === undefined}
    <Loading />
{:else if $edition === undefined || $book === undefined || data === undefined || data === null}
    <Feedback error>Unable to load book.</Feedback>
{:else}
    <Edition
        edition={$edition}
        base={`/${$book.getSubdomain() ?? $book.getRefID()}${
            data.latest ? '' : `/${$edition.getEditionNumber($book)}`
        }/`}
        editable={false}
    >
        <slot />
    </Edition>
{/if}
