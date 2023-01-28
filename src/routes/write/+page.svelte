<script lang="ts">
    import {
        createBook,
        listenToEditableBooks,
        listenToPartiallyEditableBooks,
    } from '$lib/models/CRUD';
    import type Book from '$lib/models/book/Book';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { getAuth } from '$lib/components/page/Contexts';
    import Feedback from '$lib/components/app/Feedback.svelte';
    import Lead from '$lib/components/app/Lead.svelte';
    import Large from '$lib/components/app/Large.svelte';
    import Paragraph from '$lib/components/app/Paragraph.svelte';
    import Button from '$lib/components/app/Button.svelte';
    import BookList from '$lib/components/app/BookList.svelte';
    import Section from '$lib/components/app/Section.svelte';
    import Link from '$lib/components/app/Link.svelte';

    let editableBooks: Book[] | undefined = undefined;
    let partiallyEditableBooks: Book[] | undefined = undefined;
    let error: string | undefined = undefined;
    let auth = getAuth();

    // Merge and deduplicate the books
    $: books =
        editableBooks === undefined || partiallyEditableBooks === undefined
            ? undefined
            : [...editableBooks, ...partiallyEditableBooks].filter(
                  (book1, index1, bookList) =>
                      !bookList.some(
                          (book2, index2) =>
                              index2 > index1 && book1.ref.id === book2.ref.id
                      )
              );

    // Get the books when the component loads.
    onMount(() => {
        if ($auth !== undefined && $auth.user !== null) {
            try {
                const editableUnsub = listenToEditableBooks(
                    $auth.user.uid,
                    (books) => (editableBooks = books)
                );
                const partiallyEditableUnsub = listenToPartiallyEditableBooks(
                    $auth.user.uid,
                    (books) => (partiallyEditableBooks = books)
                );
                return () => {
                    editableUnsub();
                    partiallyEditableUnsub();
                };
            } catch (err) {
                error = '' + err;
            }
        } else error = "You're not logged in.";
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
        if ($auth?.user)
            createBook($auth.user.uid)
                .then((bookID) => goto('/write/' + bookID))
                .catch((err) => {
                    creating = false;
                    console.log(err);
                    error = "Couldn't create a book: " + error;
                })
                .finally(() => clearInterval(timerID));
    }
</script>

<Section>
    <Lead><Large>Write</Large> something.</Lead>

    <Paragraph
        >Publishing is currently <Link to="#editing">invitation only</Link
        >.</Paragraph
    >
</Section>

<Button tooltip="create new book" command={newBook} disabled={creating}
    >+ book</Button
>

{#if creating}
    <Feedback>{creationFeedback}</Feedback>
{:else if error}
    <Feedback error>{error}</Feedback>
{:else if books === undefined}
    <Feedback>Loading books...</Feedback>
{:else if books.length === 0}
    <Paragraph>You don't have have any books.</Paragraph>
{:else}
    <BookList {books} write />
{/if}
