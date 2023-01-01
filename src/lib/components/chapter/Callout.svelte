<svelte:options immutable={true} />

<script lang="ts">
    import type CalloutNode from '$lib/models/chapter/CalloutNode';
    import Block from './Block.svelte';
    import Positioned from './Positioned.svelte';

    export let node: CalloutNode;
</script>

<Positioned position={node.getPosition()}>
    <section class={'bookish-callout'} data-nodeid={node.nodeID}>
        {#each node.getBlocks() as element (element.nodeID)}
            <Block node={element} />
        {/each}
    </section>
</Positioned>

<style>
    .bookish-callout {
        border: none;
        border-top: 2px solid var(--bookish-border-color-bold);
        border-bottom: 2px solid var(--bookish-border-color-bold);
        margin: var(--bookish-paragraph-spacing);
        padding-left: 0;
        padding-right: 0;
        padding-top: var(--bookish-paragraph-spacing);
        padding-bottom: var(--bookish-paragraph-spacing);
        line-height: var(--bookish-paragraph-line-height-tight);
        clear: both;
        position: relative;
    }

    .bookish-callout :global(h2),
    .bookish-callout :global(h3),
    .bookish-callout :global(h4) {
        margin-top: 0;
    }

    .bookish-callout :global(ol),
    .bookish-callout :global(ul) {
        padding-left: 1rem;
    }
</style>
