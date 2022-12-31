<script lang="ts">
    import type Book from '../../models/book/Book';
    import BookPreview from '../BookPreview.svelte';

    export let books: Book[];
    export let write: boolean;
</script>

<div class="previews">
    {#each books as book}
        <BookPreview {book} {write} />
    {/each}
</div>

<style>
    .previews {
        margin-top: var(--app-text-spacing);
        display: flex;
        flex-direction: column;
        width: 100%;
    }
</style>
