<svelte:options immutable={true} />

<script lang="ts">
    import type QuoteNode from '$lib/models/chapter/QuoteNode';
    import Block from './Block.svelte';
    import Format from './Format.svelte';
    import Positioned from './Positioned.svelte';

    export let node: QuoteNode;

    $: credit = node.getCredit();
</script>

<Positioned position={node.getPosition()}>
    <figure>
        <blockquote class={'quote'} data-nodeid={node.nodeID}>
            {#each node.getBlocks() as element (element.nodeID)}
                <Block node={element} />
            {/each}
        </blockquote>
        {#if credit}
            <figcaption class="caption {credit.isEmptyText() ? 'empty' : ''}"
                ><Format node={credit} placeholder="credit" /></figcaption
            >
        {/if}
    </figure>
</Positioned>

<style>
    .quote {
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

    .quote > :global(p) {
        margin: 0;
        padding: 0;
    }

    .caption {
        margin-top: 0.5em;
        text-align: right;
        font-family: var(--bookish-header-font-family);
        font-style: italic;
        color: var(--bookish-muted-color);
    }

    .quote:before {
        content: '\201C';
        position: relative;
        top: 80pt;
        left: -40pt;
        font-family: 'Modum Extra';
        font-size: 120pt;
        font-weight: bold;
        color: var(--bookish-highlight-color);
        z-index: -1;
    }

    .caption:not(.empty):before {
        content: '--';
        margin-right: 0.25em;
    }
</style>
