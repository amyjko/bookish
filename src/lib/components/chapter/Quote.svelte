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

<style>

    .bookish-blockquote {
        clear: both;
        border: none;
        font-family: var(--bookish-header-font-family);
        font-weight: 400;
        font-style: italic;
        padding: 0;
        margin-top: var(--bookish-paragraph-spacing);
        margin-bottom: var(--bookish-paragraph-spacing);
        margin-left: var(--bookish-indent);
        margin-right: var(--bookish-indent);
        position: relative;
    }

    .bookish-blockquote > :global(p) {
        margin: 0;
        padding: 0;
    }

    .bookish-blockquote .bookish-blockquote-caption {
        margin-top: 0.5em;
        text-align: right;
        font-family: var(--bookish-header-font-family);
        font-style: italic;
        color: var(--bookish-muted-color);
    }

    .bookish-blockquote:before {
        content: "\201C";
        position: relative;
        top: 80pt;
        left: -40pt;
        font-family: "Modum Extra";
        font-size: 120pt;
        font-weight: bold;
        color: var(--bookish-highlight-color);
        z-index: -1;
    }

    .bookish-blockquote-caption:before {
        content: "--";
        margin-right: 0.25em;
    }

</style>