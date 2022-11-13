<script lang="ts">
    import type EditionModel from "$lib/models/book/Edition"
    import type Book from '$lib/models/book/Book'
    import Loading from "$lib/components/page/Loading.svelte";
    import Edition from "$lib/components/page/Edition.svelte";
	import Alert from "$lib/components/page/Alert.svelte";

    export let data: { book: Book, edition: EditionModel, latest: boolean } | null | undefined = undefined;

</script>

{#if data === undefined }
    <Loading/>
{:else if data === null || data.book === undefined}
    <Alert>Unable to load book.</Alert>
{:else}
    <Edition edition={data.edition} base={`/${data.book.getSubdomain() ?? data.book.getRefID()}${data.latest ? "" : `/${data.edition.getEditionNumber()}`}`} editable={false}>
        <slot></slot>
    </Edition>
{/if}