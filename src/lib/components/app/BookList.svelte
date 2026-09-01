<script lang="ts">
    import type Book from '../../models/book/Book';
    import BookPreview from '../BookPreview.svelte';

    interface Props {
        books: Book[];
        write: boolean;
    }

    let { books, write }: Props = $props();
</script>

<section class="previews">
    {#each books as book}
        <BookPreview {book} {write} />
    {/each}
</section>

<style>
    .previews {
        margin-top: var(--app-text-spacing);
        display: flex;
        flex-direction: column;
        width: 100%;
    }
</style>
