<svelte:options immutable />

<script lang="ts">
    import type ChapterNode from '$lib/models/chapter/ChapterNode';
    import ParagraphNode from '$lib/models/chapter/ParagraphNode';
    import Block from './Block.svelte';
    import Paragraph from './Paragraph.svelte';
    import Problem from './Problem.svelte';

    export let node: ChapterNode;
    export let placeholder: string = '';

    $: errors = node.getErrors();
    $: blocks = node.getBlocks();
</script>

<section class="bookish-chapter-body" data-nodeid={node.nodeID}>
    {#if errors.length > 0}
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
    }

    /* This implements a drop cap in the first letter of the first text in the first format of the first paragraph of a chapter (but only chapters). */
    :global(
            .bookish-chapter-body
                p:first-of-type:not(.placeholder)::first-letter
        ) {
        padding: 0 0.25rem;
        margin: 0 0.25rem 0 0;
        font-size: 4rem;
        font-weight: 700;
        float: left;
        line-height: 1;
        color: var(--bookish-paragraph-color);
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
