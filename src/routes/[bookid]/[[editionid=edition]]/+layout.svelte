<script lang="ts">
    import type EditionModel from '$lib/models/book/Edition';
    import type Book from '$lib/models/book/Book';
    import Loading from '$lib/components/page/Loading.svelte';
    import Edition from '$lib/components/page/Edition.svelte';
    import Feedback from '$lib/components/app/Feedback.svelte';

    export let data:
        | { book: Book; edition: EditionModel; latest: boolean }
        | null
        | undefined = undefined;
</script>

{#if data === undefined}
    <Loading />
{:else if data === null || data.book === undefined}
    <Feedback error>Unable to load book.</Feedback>
{:else}
    <Edition
        edition={data.edition}
        base={`/${data.book.getSubdomain() ?? data.book.getRefID()}${
            data.latest ? '' : `/${data.edition.getEditionNumber()}`
        }/`}
        editable={false}
    >
        <slot />
    </Edition>
{/if}
