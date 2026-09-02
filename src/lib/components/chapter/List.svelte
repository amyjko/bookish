<script lang="ts">
    import List from './List.svelte';
    import ListNode from '$lib/models/chapter/ListNode';
    import Format from './Format.svelte';

    interface Props {
        node: ListNode;
    }

    let { node }: Props = $props();
</script>

<svelte:element
    this={node.isNumbered() ? 'ol' : 'ul'}
    data-nodeid={node.nodeID}
>
    {#each node.getItems() as item (item.nodeID)}
        {#if item instanceof ListNode}
            <List node={item} />
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

    li {
        margin-bottom: calc(0.5 * var(--bookish-paragraph-spacing));
    }

    /* Lists are decimal numbered */
    ol {
        list-style: decimal;
    }

    /* First level is decimal */
    ol li {
        counter-increment: list-item;
        list-style-type: decimal;
    }

    /* Second level is lowercase alpha. Nested lists render as child List
       components, so the inner elements need :global to match. */
    ol :global(ol li) {
        list-style-type: lower-alpha;
    }

    /* Third level is uppercase alpha */
    ol :global(ol ol li) {
        list-style-type: upper-alpha;
    }

    ol li::marker {
        color: var(--bookish-bullet-color);
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
