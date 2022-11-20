<script lang="ts">
    import type ParagraphNode from "$lib/models/chapter/ParagraphNode"
    import Format from './Format.svelte'
    import { getChapter } from "../page/Contexts";

    export let node: ParagraphNode;
    export let placeholder: string | undefined = undefined;

    $: level = node.getLevel();
    $: chapter = getChapter();

    $: id = node.getLevel() === 0 || $chapter === undefined ? undefined : "header-" + ($chapter.chapter.getAST()?.getHeaders().indexOf(node) ?? "");
    $: classes = node.getLevel() === 0 ? undefined: "bookish-header" + ($chapter && $chapter.highlightedID === id ? " bookish-content-highlight" : "")

</script>

{#if level === 0}
    <p data-nodeid={node.nodeID}><Format node={node.getFormat()} placeholder={placeholder ?? "¶"}/></p>
{:else}
    <svelte:element this={`h${level + 1}`} class={classes} id={id} data-nodeid={node.nodeID}><Format node={node.getFormat()} /></svelte:element>
{/if}

<style>


</style>