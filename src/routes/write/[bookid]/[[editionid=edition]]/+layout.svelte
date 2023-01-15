<script lang="ts">
    import type EditionModel from '$lib/models/book/Edition';
    import type Book from '$lib/models/book/Book';
    import Loading from '$lib/components/page/Loading.svelte';
    import Edition from '$lib/components/page/Edition.svelte';
    import Feedback from '$lib/components/app/Feedback.svelte';
    import {
        getAuth,
        getBook,
        getEdition,
    } from '$lib/components/page/Contexts';
    import { onDestroy } from 'svelte';

    export let data: { book: Book; edition: EditionModel } | null | undefined =
        undefined;

    let book = getBook();
    let edition = getEdition();
    let auth = getAuth();

    // Update the global stores to the book and edition received.
    $: edition.set(data ? data.edition : undefined);
    $: book.set(data ? data.book : undefined);

    // When this is unmounted, unset them.
    onDestroy(() => {
        edition.set(undefined);
        book.set(undefined);
    });
</script>

{#if data === undefined}
    <Loading />
{:else if $auth === undefined || $auth.user === null}
    <Feedback error>You're not logged in.</Feedback>
{:else if $edition === undefined || $book === undefined}
    <Feedback error>Unable to load book. Maybe the link isn't correct?</Feedback
    >
{:else if $auth !== undefined && $auth.user !== null && !data?.edition.uids.includes($auth.user.uid)}
    <Feedback>You don't have permission to edit this edition.</Feedback>
{:else}
    <Edition
        edition={$edition}
        base={`/write/${$book.getRefID()}/${$edition.getEditionNumber($book)}/`}
        editable={data?.edition.uids.includes($auth.user.uid)}
    >
        <slot />
    </Edition>
{/if}
