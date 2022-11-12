<script lang="ts">
    import type ParagraphNode from "$lib/models/chapter/ParagraphNode"
    import Format from './Format.svelte'
    import { getChapter } from "../page/Contexts";

    export let node: ParagraphNode;
    export let placeholder: string | undefined = undefined;

    let level = node.getLevel();
    let chapter = getChapter();

    const id = node.getLevel() === 0 ? undefined : "header-" + ($chapter.chapter.getAST()?.getHeaders().indexOf(node) ?? "");
    const classes = node.getLevel() === 0 ? undefined: "bookish-header" + ($chapter.highlightedID === id ? " bookish-content-highlight" : "")

</script>

{#if level === 0}
    <p data-nodeid={node.nodeID}><Format node={node.getFormat()} placeholder={placeholder ?? "¶"}/></p>
{:else}
    <svelte:element this={`h${level + 1}`} class={classes} id={id} data-nodeid={node.nodeID}><Format node={node.getFormat()} /></svelte:element>
{/if}