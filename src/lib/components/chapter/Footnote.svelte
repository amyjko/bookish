<script lang="ts">
    import type FootnoteNode from '$lib/models/chapter/FootnoteNode';
    import Atom from '$lib/components/chapter/Atom.svelte';
    import Marginal from '$lib/components/chapter/Marginal.svelte';
    import Format from './Format.svelte';
    import {
        getChapter,
        getEdition,
        getCaret,
        getRoot,
    } from '$lib/components/page/Contexts';

    interface Props {
        node: FootnoteNode;
    }

    let { node }: Props = $props();

    let meta = $derived(node.getMeta());
    let caret = getCaret();

    let chapter = getChapter();
    let edition = getEdition();
    let root = getRoot();

    // What footnote number is this?
    let number = $derived($root.getFootnotes().indexOf(node));
    let letter = $derived(
        number === undefined ? undefined : $edition?.getFootnoteSymbol(number),
    );

    let focused = $derived(
        $caret &&
            $caret.range &&
            $caret.range.start.node.hasAncestor($root, node),
    );

    // Whenever anything that affects this footnote's rendered size or
    // position changes, request a chapter-wide marginal layout pass.
    $effect(() => {
        void meta;
        void number;
        void letter;
        void focused;
        $chapter?.requestLayout();
    });
</script>

<Atom {node}>
    <span class={`bookish-footnote-link`} data-nodeid={node.nodeID}>
        <Marginal
            {node}
            id={'footnote-' + number}
            label="footnote, press escape to edit"
        >
            <!-- We prevent default on the span to prevent mouse events from bubbling up to the footnote symbol. This is key for two reasons:
                 1) clicks on the footnote select the footnote atom node itself
                 2) we want to be able to click on footnote text and we can't do that if the footnote sets the caret to the atom after clicks. -->
            {#snippet interactor()}
                <sup class="bookish-footnote-symbol">{letter}</sup>
            {/snippet}
            {#snippet content()}
                <span
                    class={`bookish-footnote ${
                        focused ? 'bookish-footnote-focused' : ''
                    }`}
                >
                    <sup class="bookish-footnote-symbol">{letter}</sup><Format
                        node={meta}
                        placeholder="footnote"
                    /></span
                >
            {/snippet}
        </Marginal>
    </span>
</Atom>

<style>
    sup {
        line-height: 0;
    }

    .bookish-footnote-focused {
        outline: 2px solid var(--bookish-highlight-color);
    }

    .bookish-footnote {
        font-family: var(--bookish-paragraph-font-family);
        font-size: var(--bookish-small-font-size);
        font-style: normal;
        color: var(--bookish-paragraph-color);
        font-weight: 300;
        font-size: var(--bookish-small-font-size);
        /* line-height: 1.5em; */
        text-align: left;
    }

    .bookish-footnote-symbol {
        font-family: var(--bookish-paragraph-font-family);
        font-weight: normal;
        color: var(--bookish-link-color);
        position: relative;
    }

    .bookish-footnote {
        display: block;
        line-height: var(--bookish-paragraph-line-height-tight);
    }

    .bookish-footnote .bookish-footnote-symbol {
        display: block;
        float: left;
        margin-left: -1em;
    }
</style>
