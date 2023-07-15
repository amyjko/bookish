<svelte:options immutable />

<script lang="ts">
    import type ChapterNode from '$lib/models/chapter/ChapterNode';
    import ParagraphNode from '$lib/models/chapter/ParagraphNode';
    import { writable } from 'svelte/store';
    import { setContext } from 'svelte';
    import { ROOT } from '../page/Contexts';
    import Block from './Block.svelte';
    import Paragraph from './Paragraph.svelte';
    import Problem from './Problem.svelte';

    export let node: ChapterNode;
    export let placeholder: string = '';
    export let editable: boolean = false;

    $: errors = node.getErrors();
    $: blocks = node.getBlocks();

    // Make this chapter node available to all children in a reactive store.
    let root = writable<ChapterNode>(node);
    setContext(ROOT, root);
    $: root.set(node);
</script>

<section class="bookish-chapter-body" data-nodeid={node.nodeID}>
    {#if editable && errors.length > 0}
        <p>
            <Problem
                >{errors.length +
                    ' ' +
                    (errors.length > 1 ? 'errors' : 'error')} below</Problem
            >
        </p>
    {/if}
    {#if blocks.length === 1 && blocks[0] instanceof ParagraphNode && blocks[0]
            .getFormat()
            .isEmptyText()}
        <Paragraph node={blocks[0]} {placeholder} />
    {:else}
        {#each node.getBlocks() as block (block.nodeID)}
            <Block node={block} />
        {/each}
    {/if}
</section>

<style>
    /* This accounts for completely empty chapters. */
    .bookish-chapter-body {
        min-height: 2em;
        min-width: 100%;

        overflow-wrap: break-word;
    }

    :global(.bookish-content-highlight) {
        position: relative;
    }

    /* A rectangular highlight like a highlighter marker over highlighted text */
    :global(.bookish-content-highlight:before) {
        content: '';
        z-index: -1;
        left: -0.25em;
        top: -0.5em;
        position: absolute;
        width: 100%;
        height: 2em;
        opacity: 0.7;
        padding: 0.1em 0.25em;
        transform: skew(-10deg);
        background-color: var(--bookish-highlight-color);
        filter: url(#marker);
    }
</style>
