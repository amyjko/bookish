<script lang="ts">
    import Chapter from './Chapter.svelte';
    import { getEdition } from './Contexts';

    let edition = getEdition();
</script>

{#if $edition}
    {#each $edition
        .getChapters()
        .filter((chapter) => !chapter.isForthcoming()) as chapter}
        <Chapter {chapter} print />
    {/each}
{/if}

<style>
    @media print {
        :global(.bookish-chapter-header) {
            break-before: page;
        }

        :global(body) {
            font-size: 16pt;
        }

        @page {
            margin: 1in;
        }

        :global(h1, h2, h3, h4, h5, h6) {
            break-after: avoid !important;
        }
    }
</style>
