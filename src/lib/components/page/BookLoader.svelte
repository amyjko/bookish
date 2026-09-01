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
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();

    let auth = getUser();
    let book = getBook();

    // Keep track of the query updates
    let booksByName: Book[] | undefined = $state(undefined);
    let bookByID: Book | null | undefined = $state(undefined);

    // Merge them together here
    let currentBook = $derived.by(() => {
        // Neither loaded? Current book isn't loaded.
        if (booksByName === undefined && bookByID === undefined)
            return undefined;
        return booksByName !== undefined && booksByName.length > 0
            ? booksByName[0]
            : bookByID ?? null;
    });

    // Whenever the merge changes, update the book store (updating the whole UI)
    $effect.pre(() => {
        book.set(currentBook ?? undefined);
    });

    // Keep track of listeners to unsubscribe to on page changes.
    let nameUnsub: Unsubscribe | undefined = undefined;
    let idUnsub: Unsubscribe | undefined = undefined;

    function unsub() {
        if (nameUnsub) nameUnsub();
        if (idUnsub) idUnsub();
    }

    // Keep track of any errors.
    let error: string | undefined = $state();

    function listen() {
        unsub();
        const bookid = $page.params.bookid;
        if (bookid === undefined) return;
        try {
            nameUnsub = listenToBooksWithName(
                bookid,
                (books) => (booksByName = books)
            );
            idUnsub = listenToBooksWithID(
                bookid,
                (book) => (bookByID = book)
            );
        } catch (err) {
            error = '' + err;
        }
    }

    // When page or auth changes and there's a user, update the listener.
    $effect(() => {
        if ($page && $auth && $auth.user !== null) listen();
    });

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
    {@render children?.()}
{/if}
