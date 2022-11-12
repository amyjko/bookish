<script lang="ts">
    import type EditionModel from "$lib/models/book/Edition"
    import type Book from '$lib/models/book/Book'
    import Loading from "$lib/components/page/Loading.svelte";
    import Edition from "$lib/components/page/Edition.svelte";

    export let data: { book: Book, edition: EditionModel } | null | undefined = undefined;

</script>

{#if data === undefined }
    <Loading/>
{:else if data === null}
    <div class="bookish-app-alert">Unable to load book.</div>
{:else}

    <Edition edition={data.edition} base={`/write/${data.book.getRefID()}/${data.edition.getEditionNumber()}`} editable={true}>
        <slot></slot>
    </Edition>
{/if}