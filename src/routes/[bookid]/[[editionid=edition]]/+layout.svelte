<script lang="ts">
    import Loading from '$lib/components/page/Loading.svelte';
    import Edition from '$lib/components/page/Edition.svelte';
    import Feedback from '$lib/components/app/Feedback.svelte';
    import { getBook, getEdition } from '$lib/components/page/Contexts';
    import { onDestroy } from 'svelte';
    import loadEdition from '$lib/models/loadEdition';
    import { page } from '$app/stores';

    let book = getBook();
    let edition = getEdition();

    let error = false;
    async function load() {
        const loadedEdition = await loadEdition(
            $page.params.bookid,
            $page.params.editionid,
            true
        );
        // Update the global stores to the book and edition received.
        if (loadedEdition === null) error = true;
        else edition.set(loadedEdition);
    }

    $: if ($page) load();

    // When unmounted, unset the stores — no longer viewing a book.
    onDestroy(() => {
        edition.set(undefined);
        book.set(undefined);
    });
</script>

{#if $book === undefined || error}
    <Feedback error>Unable to load book.</Feedback>
{:else if $edition === undefined}
    <Loading />
{:else}
    <Edition
        edition={$edition}
        base={`/${$book.getSubdomain() ?? $book.getRefID()}/`}
    >
        <slot />
    </Edition>
{/if}
