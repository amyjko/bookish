<script lang="ts">
    import {
        createBookInFirestore,
        loadUsersBooksFromFirestore,
    } from '$lib/models/Firestore';
    import BookPreview from '$lib/components/BookPreview.svelte';
    import type Book from '$lib/models/book/Book';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { getAuth } from '$lib/components/page/Contexts';
    import Feedback from '$lib/components/app/Feedback.svelte';
    import Lead from '$lib/components/app/Lead.svelte';
    import Large from '$lib/components/app/Large.svelte';
    import Paragraph from '$lib/components/app/Paragraph.svelte';
    import Button from '$lib/components/app/Button.svelte';

    let books: Book[] = [];
    let loading = true;
    let error = '';

    let auth = getAuth();

    function updateBooks() {
        if ($auth.user)
            loadUsersBooksFromFirestore($auth.user.uid).then((loadedBooks) => {
                loading = false;
                if (loadedBooks === null) error = 'Unable to load books';
                else books = loadedBooks;
            });
    }

    // Get the books when the component loads.
    onMount(() => {
        updateBooks();
    });

    let creating = false;
    let timeSinceCreation = 0;
    let creationFeedback = '';

    function newBook() {
        creating = true;
        creationFeedback = 'Creating book...';
        timeSinceCreation = Date.now();
        const timerID = setInterval(() => {
            const delta = Date.now() - timeSinceCreation;
            creationFeedback =
                delta < 3000
                    ? 'Creating book...'
                    : delta < 6000
                    ? 'Still trying to create book...'
                    : delta < 9000
                    ? 'Internet is slow or offline, but will keep trying...'
                    : 'Sorry this is taking so long! If the internet connection comes back, we will create the book.';
        }, 1000);
        // Make the book, then go to its page
        if ($auth.user)
            createBookInFirestore($auth.user.uid)
                .then((bookID) => goto('/write/' + bookID))
                .catch((error) => {
                    creating = false;
                    error = "Couldn't create a book: " + error;
                })
                .finally(() => clearInterval(timerID));
    }
</script>

<Lead><Large>Write</Large> something.</Lead>

<Paragraph>
    <Button tooltip="Create a new book" command={newBook} disabled={creating}
        >Create book</Button
    >
</Paragraph>

{#if creating}
    <Feedback>{creationFeedback}</Feedback>
{/if}

{#if error}
    <Feedback error>{error}</Feedback>
{:else if loading}
    <Feedback>Loading books...</Feedback>
{:else if books.length === 0}
    <Paragraph>You don't have have any books.</Paragraph>
{:else}
    <div class="previews">
        {#each books as book}
            <BookPreview {book} write />
        {/each}
    </div>
{/if}

<style>
    .previews {
        margin-top: var(--app-text-spacing);
        display: flex;
        flex-direction: column;
    }
</style>
