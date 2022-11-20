<script lang="ts">
    import type LinkNode from "$lib/models/chapter/LinkNode";
    import { getBase, getEdition, isEditable } from "../page/Contexts";
    import Text from './Text.svelte'
    import Problem from "./Problem.svelte";

    export let node: LinkNode;

    let base = getBase();
    let editable = isEditable();
    let edition = getEdition();

    $: url = node.getMeta();
    $: content = node.getText();

    function isInvalidChapterLink() {
        // If it's internal, validate it.
        if(!url.startsWith("http")) {

            // Pull out any labels and just get the chapter name.
            let chapter = url;
            if(url.indexOf(":") >= 0) {
                let parts = chapter.split(":");
                chapter = parts[0];
            }

            if(chapter !== "" && !$edition.hasChapter(chapter))
                return true;

        }
        return false;
    }

</script>

{#if editable}
    <span class="bookish-editor-link"><Text node={content} /></span>
<!-- If this is an invalid chapter link, say so -->
{:else if isInvalidChapterLink()}
    <Problem>Unknown chapter name reference '{url}'</Problem>
<!-- If this is external link, make an anchor that opens a new window. -->
{:else if url.startsWith("http")}
    <a href={url} target="_blank" rel="noreferrer"><Text node={content} /></a>
<!-- If's a chapter link with a label -->
{:else if url.indexOf(":") >= 0}
    <!-- If the chapter isn't specified, set to the current chapter's id. -->
    {#if url.split(":")[0] === ""}
        <a href={"#" + url.split(":")[1]}><Text node={content} /></a>
    {:else}
        <a href={"/" + url.split(":")[0] + "#" + url.split(":")[1]}><Text node={content} /></a>
    {/if}
<!-- If this is internal link, make a route link to the chapter. -->
{:else}       
    <a href={base + "/" + url}><Text node={content} /></a>
{/if}

<style>
    .bookish-editor-link {
        color: var(--bookish-link-color);
        font-weight: var(--bookish-link-font-weight);
    }
</style>
