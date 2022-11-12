<script lang="ts">
    import type CalloutNode from "$lib/models/chapter/CalloutNode"
    import Block from "./Block.svelte";
    import renderPosition from "./renderPosition";

    export let node: CalloutNode;

</script>

<div class={"bookish-callout " + renderPosition(node.getPosition())} data-nodeid={node.nodeID}>
    {#each node.getBlocks() as element }
        <Block node={element} />
    {/each}
</div>