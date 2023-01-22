<svelte:options immutable={true} />

<script lang="ts">
    import type ParagraphNode from '$lib/models/chapter/ParagraphNode';
    import Format from './Format.svelte';
    import { getChapter, getEdition } from '../page/Contexts';

    export let node: ParagraphNode;
    export let placeholder: string | undefined = undefined;

    $: level = node.getLevel();
    $: chapter = getChapter();
    $: edition = getEdition();

    $: id =
        node.getLevel() === 0 ||
        $chapter === undefined ||
        $edition === undefined
            ? undefined
            : 'header-' +
              ($chapter.chapter.getAST($edition)?.getHeaders().indexOf(node) ??
                  '');
    $: classes =
        node.getLevel() === 0
            ? undefined
            : 'bookish-header' +
              ($chapter && $chapter.highlightedID === id
                  ? ' bookish-content-highlight'
                  : '');
</script>

{#if level === 0}
    <p data-nodeid={node.nodeID} class:placeholder
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
</style>
