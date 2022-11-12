<script lang="ts">
    import Chapter from "$lib/components/page/Chapter.svelte";
    import { page } from "$app/stores"
    import { getContext } from "svelte";
    import { EDITION } from "$lib/components/page/Symbols";
    import type Edition from "$lib/models/book/Edition";
    import type { Writable } from "svelte/store";

    $: edition = getContext<Writable<Edition>>(EDITION);
    $: chapterID = $page.params.chapterid;
    $: chapter = $edition.getChapter(chapterID);

</script>

{#if chapter }
    <Chapter chapter={chapter}/>
{:else}
    <div class="bookish-error">This chapter doesn't exist.</div>
{/if}