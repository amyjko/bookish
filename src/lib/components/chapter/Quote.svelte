<script lang="ts">
    import type QuoteNode from "$lib/models/chapter/QuoteNode"
    import Block from "./Block.svelte";
    import Format from './Format.svelte';
    import renderPosition from "./renderPosition";

    export let node: QuoteNode;

    $: credit = node.getCredit();
    $: position = node.getPosition();

</script>

<blockquote class={"bookish-blockquote " + renderPosition(position)} data-nodeid={node.nodeID}>
    {#each node.getBlocks() as element}
        <Block node={element}/>
    {/each}
    {#if credit}
        <div class="bookish-blockquote-caption"><span><Format node={credit} placeholder="credit"/></span></div>
    {/if}
</blockquote>