<script lang="ts">
    import Chapter from './Chapter.svelte';
    import { getEdition } from './Contexts';

    let edition = getEdition();

</script>

{#each $edition.getChapters().filter(chapter => !chapter.isForthcoming()) as chapter }
    <Chapter chapter={chapter} print />
{/each}