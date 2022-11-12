<script lang="ts">
    import { getContext } from 'svelte';
    import type Edition from '$lib/models/book/Edition';
    import Chapter from "$lib/components/chapter/Chapter.svelte";
    import { EDITION } from './Symbols';
    import type { Writable } from 'svelte/store';

    let edition = getContext<Writable<Edition>>(EDITION);

</script>

{#each $edition.getChapters().filter(chapter => !chapter.isForthcoming()) as chapter }
    <Chapter book={edition} chapter={chapter} print />
{/each}