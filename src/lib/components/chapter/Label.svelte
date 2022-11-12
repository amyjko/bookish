<script lang="ts">
    import type LabelNode from "$lib/models/chapter/LabelNode"
    import Atom from '$lib/components/chapter/Atom.svelte';
    import { getChapter, isEditable } from "../page/Contexts";

    export let node: LabelNode;

    let editable = isEditable();
    let chapter = getChapter();

    $: ast = $chapter?.chapter.getAST();
    $: duplicate = ast === undefined ? false : ast.getLabels().filter(l => l.getMeta() === node.getMeta()).length > 1;

</script>

<Atom node={node}>
    <span 
        class={"bookish-label" + ($chapter?.highlightedID === node.getMeta() ? " bookish-content-highlight" : "")} 
        id={node.getMeta()}
        data-nodeid={node.nodeID}
    >
        {#if editable}
            <span class={`${duplicate ? "bookish-error" : ""}`}>•<code>{node.getMeta()}</code></span>
        {/if}
    </span>
</Atom>