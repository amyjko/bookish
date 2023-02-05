<svelte:options immutable={true} />

<script lang="ts">
    import ListNode from '$lib/models/chapter/ListNode';
    import Format from './Format.svelte';

    export let node: ListNode;
</script>

<svelte:element
    this={node.isNumbered() ? 'ol' : 'ul'}
    data-nodeid={node.nodeID}
>
    {#each node.getItems() as item (item.nodeID)}
        {#if item instanceof ListNode}
            <svelte:self node={item} />
        {:else}
            <li><Format node={item} /></li>
        {/if}
    {/each}
</svelte:element>

<style>
    ol,
    ul {
        line-height: var(--bookish-paragraph-line-height-tight);
    }

    ol {
        list-style: none;
        counter-reset: item;
    }

    ol > li {
        counter-increment: item;
    }

    ol > li {
        list-style-type: none;
    }

    ol > :global(ol > li) {
        list-style-type: none;
    }

    ol > :global(ol > ol > li) {
        list-style-type: none;
    }

    ol > :global(li::before),
    ul > :global(ol > li::before),
    ul > :global(ul > ol > li::before) {
        content: counter(item) '. ';
        color: var(--bookish-bullet-color);
        display: inline-block;
        width: 1em;
        margin-left: -1.5rem;
        margin-right: 0.5rem;
        text-align: right;
    }

    ol > :global(ol > li::before),
    ul > :global(ol > ol > li::before) {
        content: counter(item, lower-alpha) '. ';
    }

    ol > :global(ol > ol > li:before) {
        content: counter(item, upper-alpha) '. ';
    }

    li {
        margin-bottom: calc(0.5 * var(--bookish-paragraph-spacing));
    }

    ul li {
        list-style: none;
    }

    ul li::before {
        content: '*';
        color: var(--bookish-bullet-color);
        display: inline-block;
        width: 1rem;
        margin-left: -1rem;
        font-family: var(--bookish-bullet-font-family);
        font-weight: var(--bookish-bullet-font-weight);
    }
</style>
