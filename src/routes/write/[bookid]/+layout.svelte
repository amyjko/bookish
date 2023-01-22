<script lang="ts">
    import Loading from '$lib/components/page/Loading.svelte';
    import Feedback from '$lib/components/app/Feedback.svelte';
    import { getAuth, getBook } from '$lib/components/page/Contexts';
    import { onDestroy, setContext } from 'svelte';
    import { getBookFromIDOrName } from '$lib/models/CRUD';
    import { page } from '$app/stores';

    let book = getBook();
    let auth = getAuth();

    book.set(undefined);
    let error = false;

    async function load() {
        const bookOrNull = await getBookFromIDOrName($page.params.bookid);
        if (bookOrNull === null) error = true;
        else book.set(bookOrNull);
    }

    $: if ($page) load();

    // When this is unmounted, unset them.
    onDestroy(() => {
        book.set(undefined);
    });
</script>

{#if $book === undefined}
    <Loading />
{:else if error}
    <Feedback error>Unable to load this book.</Feedback>
{:else}
    <slot />
{/if}
