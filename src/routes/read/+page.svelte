<script lang="ts">
    import { loadPublishedBooksFromFirestore } from '$lib/models/Firestore';
    import type Book from '$lib/models/book/Book';
    import { onMount } from 'svelte';
    import Feedback from '$lib/components/app/Feedback.svelte';
    import Lead from '$lib/components/app/Lead.svelte';
    import Paragraph from '$lib/components/app/Paragraph.svelte';
    import Large from '$lib/components/app/Large.svelte';
    import BookList from '$lib/components/app/BookList.svelte';

    let books: Book[] = [];
    let loading = true;
    let error = '';

    function updateBooks() {
        loadPublishedBooksFromFirestore().then((loadedBooks) => {
            loading = false;
            if (loadedBooks === null) error = 'Unable to load books';
            else books = loadedBooks;
        });
    }

    // Get the books when the component loads.
    onMount(() => {
        updateBooks();
    });
</script>

<Lead><Large>Read</Large> something.</Lead>

{#if error}
    <Feedback error>{error}</Feedback>
{:else if loading}
    <Feedback>Loading books...</Feedback>
{:else if books.length === 0}
    <Paragraph>There are no published books.</Paragraph>
{:else}
    <BookList {books} write={false} />
{/if}
