<script lang="ts">
    import { getPublishedBooks } from '$lib/models/CRUD';
    import type Book from '$lib/models/book/Book';
    import { onMount } from 'svelte';
    import Feedback from '$lib/components/app/Feedback.svelte';
    import Lead from '$lib/components/app/Lead.svelte';
    import Paragraph from '$lib/components/app/Paragraph.svelte';
    import Large from '$lib/components/app/Large.svelte';
    import BookList from '$lib/components/app/BookList.svelte';

    let books: Book[] | undefined = undefined;
    let error: string | undefined = undefined;

    function updateBooks(latestBooks: Book[]) {
        books = latestBooks;
    }

    // Get the books when the component loads, stop listening on unmount.
    onMount(() => {
        try {
            return getPublishedBooks(updateBooks);
        } catch (err) {
            error = '' + err;
        }
    });
</script>

<Lead><Large>Read</Large> something.</Lead>

{#if error !== undefined}
    <Feedback error>{error}</Feedback>
{:else if books === undefined}
    <Feedback>Loading books...</Feedback>
{:else if books.length === 0}
    <Paragraph>There are no published books.</Paragraph>
{:else}
    <BookList {books} write={false} />
{/if}
