<svelte:options immutable={true} />

<script lang="ts">
    import type ParagraphNode from '$lib/models/chapter/ParagraphNode';
    import Format from './Format.svelte';
    import { getChapter, getEdition, getRoot } from '../page/Contexts';

    export let node: ParagraphNode;
    export let placeholder: string | undefined = undefined;

    $: level = node.getLevel();

    let chapter = getChapter();
    let edition = getEdition();
    let root = getRoot();

    $: id =
        node.getLevel() === 0 || $edition === undefined
            ? undefined
            : 'header-' + ($root.getHeaders().indexOf(node) ?? '');
    $: classes =
        node.getLevel() === 0
            ? undefined
            : 'page-header' +
              ($chapter && $chapter.highlightedID === id
                  ? ' bookish-content-highlight'
                  : '');

    $: firstParagraph = $root.getFirstParagraph();
    $: dropcap =
        placeholder === undefined &&
        node === firstParagraph &&
        /^[a-zA-Z]/.test(firstParagraph.getFirstTextNode().getText());
</script>

{#if level === 0}
    <p data-nodeid={node.nodeID} class:placeholder class:dropcap
        ><Format node={node.getFormat()} placeholder={placeholder ?? '¶'} /></p
    >
{:else}
    <svelte:element
        this={`h${level + 1}`}
        class={classes}
        {id}
        data-nodeid={node.nodeID}
        ><Format node={node.getFormat()} /></svelte:element
    >
{/if}

<style>
    p {
        font-family: var(--bookish-paragraph-font-family);
        font-size: var(--bookish-paragraph-font-size);
        color: var(--bookish-paragraph-color);

        margin-top: var(--bookish-paragraph-spacing);
        margin-bottom: var(--bookish-paragraph-spacing);

        line-height: var(--bookish-paragraph-line-height);

        /* Allow paragraphs to break on words to support small screens. */
        word-break: break-word;

        /* Empty paragraphs should have at least some height. */
        min-height: var(--bookish-paragraph-line-height);
    }

    /* This implements a drop cap in the first letter of the first text in the first format of the first paragraph of a chapter (but only chapters). */
    p.dropcap::first-letter {
        padding: 0 0.25rem;
        margin: 0 0.25rem 0 0;
        font-size: 4rem;
        font-weight: 700;
        float: left;
        line-height: 1;
        color: var(--bookish-paragraph-color);
    }

    .placeholder {
        color: var(--bookish-muted-color);
        font-style: italic;
    }

    h2,
    h3,
    h4,
    h5,
    h6 {
        font-family: var(--bookish-header-font-family);
        font-weight: var(--bookish-header-font-weight);
        margin-top: var(--bookish-header-spacing);
        margin-bottom: var(--bookish-header-spacing);
        line-height: var(--bookish-header-line-height);
    }

    h2 {
        font-size: var(--bookish-header-1-font-size);
    }

    h3 {
        font-size: var(--bookish-header-2-font-size);
    }

    h4 {
        font-size: var(--bookish-header-3-font-size);
        font-style: italic;
    }

    h5 {
        font-size: var(--bookish-paragraph-font-size);
        display: inline;
    }

    h5::after {
        content: '. ';
    }

    h5 + :global(p) {
        display: inline;
    }

    h5 + :global(p::after) {
        content: '\0A';
        display: block;
    }
</style>
