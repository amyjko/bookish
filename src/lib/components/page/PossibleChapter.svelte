<script lang="ts">
    import Chapter from "$lib/components/page/Chapter.svelte";
    import { page } from "$app/stores"
    import { getEdition } from "$lib/components/page/Contexts";
    import Unknown from "$lib/components/page/Unknown.svelte";

    $: edition = getEdition();
    $: chapterID = $page.params.chapterid;
    $: chapter = $edition.getChapter(chapterID);
</script>

{#if chapter}
    <Chapter chapter={chapter}/>
{:else}
    <Unknown>This chapter doesn't exist...</Unknown>
{/if}