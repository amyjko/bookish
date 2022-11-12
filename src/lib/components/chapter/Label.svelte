<script lang="ts">
    import type LabelNode from "$lib/models/chapter/LabelNode"
    import Atom from '$lib/components/chapter/Atom.svelte';
    import { CHAPTER, EDITABLE } from "../page/Symbols";
    import { getContext } from "svelte";
    import type ChapterContext from "$lib/components/page/ChapterContext";

    export let node: LabelNode;

    let editable = getContext<boolean>(EDITABLE);
    let context = getContext<ChapterContext>(CHAPTER);

    $: ast = context.chapter.getAST();
    $: duplicate = ast === undefined ? false : ast.getLabels().filter(l => l.getMeta() === node.getMeta()).length > 1;

</script>

<Atom node={node}>
    <span 
        class={"bookish-label" + (context.highlightedID === node.getMeta() ? " bookish-content-highlight" : "")} 
        id={node.getMeta()}
        data-nodeid={node.nodeID}
    >
        {#if editable}
            <span class={`${duplicate ? "bookish-error" : ""}`}>•<code>{node.getMeta()}</code></span>
        {/if}
    </span>
</Atom>