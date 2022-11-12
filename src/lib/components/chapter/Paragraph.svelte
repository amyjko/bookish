<script lang="ts">
    import type ParagraphNode from "$lib/models/chapter/ParagraphNode"
    import { getContext } from "svelte";
    import type ChapterNode from "$lib/models/chapter/ChapterNode";
    import Format from './Format.svelte'

    export let node: ParagraphNode;
    export let placeholder: string | undefined = undefined;

    let level = node.getLevel();
    let highlight = getContext<string>("highlight");
    let chapter = getContext<ChapterNode>("chapter");

    const id = node.getLevel() === 0 ? undefined : "header-" + (chapter.getHeaders().indexOf(node) ?? "");
    const classes = node.getLevel() === 0 ? undefined: "bookish-header" + (highlight === id ? " bookish-content-highlight" : "")

</script>

{#if level === 0}
    <p data-nodeid={node.nodeID}><Format node={node.getFormat()} placeholder={placeholder ?? "¶"}/></p>
{:else}
    <svelte:element this={`h${level + 1}`} class={classes} id={id} data-nodeid={node.nodeID}><Format node={node.getFormat()} /></svelte:element>
{/if}