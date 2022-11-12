<script lang="ts">
    import Chapter from "$lib/components/page/Chapter.svelte";
    import { page } from "$app/stores"
    import { getEdition } from "$lib/components/page/Contexts";

    $: edition = getEdition();
    $: chapterID = $page.params.chapterid;
    $: chapter = $edition.getChapter(chapterID);

</script>

{#if chapter }
    <Chapter chapter={chapter}/>
{:else}
    <div class="bookish-error">This chapter doesn't exist.</div>
{/if}