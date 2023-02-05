<script lang="ts">
    import Loading from '$lib/components/page/Loading.svelte';
    import Feedback from '$lib/components/app/Feedback.svelte';
    import { onDestroy } from 'svelte';
    import { page } from '$app/stores';
    import type Book from '$lib/models/book/Book';
    import { getBook, getUser } from '$lib/components/page/Contexts';
    import {
        listenToBookWithID as listenToBooksWithID,
        listenToBooksByName as listenToBooksWithName,
    } from '$lib/models/CRUD';
    import type { Unsubscribe } from 'firebase/auth';

    let auth = getUser();
    let book = getBook();

    // Keep track of the query updates
    let booksByName: Book[] | undefined = undefined;
    let bookByID: Book | null | undefined = undefined;

    // Mege them together here
    $: currentBook =
        // Neither loaded? Current book isn't loaded.
        booksByName === undefined && bookByID === undefined
            ? undefined
            : booksByName !== undefined && booksByName.length > 0
            ? booksByName[0]
            : bookByID ?? null;

    // Whenever the merge changes, update the book store (updating the whole UI)
    $: book.set(currentBook ?? undefined);

    // Keep track of listeners to unsubscribe to on page changes.
    let nameUnsub: Unsubscribe | undefined = undefined;
    let idUnsub: Unsubscribe | undefined = undefined;

    function unsub() {
        if (nameUnsub) nameUnsub();
        if (idUnsub) idUnsub();
    }

    // Keep track of any errors.
    let error: string | undefined;

    function listen() {
        unsub();
        try {
            nameUnsub = listenToBooksWithName(
                $page.params.bookid,
                (books) => (booksByName = books)
            );
            idUnsub = listenToBooksWithID(
                $page.params.bookid,
                (book) => (bookByID = book)
            );
        } catch (err) {
            error = '' + err;
        }
    }

    // When page or auth changes and there's a user, update the listener.
    $: if ($page && $auth && $auth.user !== null) listen();

    // When this is unmounted, unset them.
    onDestroy(() => {
        book.set(undefined);
        unsub();
    });
</script>

{#if error || currentBook === null}
    <Feedback error>Unable to load book.</Feedback>
{:else if currentBook === undefined}
    <Loading />
{:else}
    <slot />
{/if}
