<script lang="ts">
    import Chapter from '$lib/components/page/Chapter.svelte';
    import { page } from '$app/state';
    import { getEdition } from '$lib/components/page/Contexts';
    import Unknown from '$lib/components/page/Unknown.svelte';

    let edition = $derived(getEdition());
    let chapterID = $derived(page.params.chapterid);
    let chapter =
        $derived(chapterID === undefined ? undefined : $edition?.getChapter(chapterID));
</script>

{#if chapter}
    <Chapter {chapter} />
{:else}
    <Unknown>This chapter doesn't exist...</Unknown>
{/if}
