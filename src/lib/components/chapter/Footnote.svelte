<script lang="ts">
    import type FootnoteNode from "$lib/models/chapter/FootnoteNode";
    import Atom from '$lib/components/chapter/Atom.svelte'
    import Marginal from '$lib/components/chapter/Marginal.svelte'
    import Format from './Format.svelte';
    import { getCaret, getChapter, getEdition } from "../page/Contexts";
    import { afterUpdate } from "svelte";

    export let node: FootnoteNode;

    $: content = node.getMeta();
    let caret = getCaret();
    let chapter = getChapter();
    let edition = getEdition();

    // What footnote number is this?
    $: chapterNode = $chapter?.chapter?.getAST();
    $: number = chapterNode?.getFootnotes().indexOf(node);
    $: letter = number === undefined ? undefined : $edition.getFootnoteSymbol(number);

    $: focused = chapterNode && $caret && $caret.range && $caret.range.start.node.hasAncestor(chapterNode, node);

    // Position the marginals on every render.
    afterUpdate(() => $chapter?.layoutMarginals());
    
</script>

<Atom node={node}>
    <span class={`bookish-footnote-link`} data-nodeid={node.nodeID}>
        <Marginal id={"footnote-" + number}>
            <sup slot="interactor" class="bookish-footnote-symbol">{letter}</sup>
            <!-- We prevent default on the span to prevent mouse events from bubbling up to the footnote symbol. This is key for two reasons:
                 1) clicks on the footnote select the footnote atom node itself
                 2) we want to be able to click on footnote text and we can't do that if the footnote sets the caret to the atom after clicks. -->
            <span slot="content" class={`bookish-footnote ${focused ? "bookish-footnote-focused" : ""}`} on:mousedown|preventDefault>
                <sup class="bookish-footnote-symbol">{letter}</sup><Format node={content} placeholder="footnote"/></span>
        </Marginal>
    </span>
</Atom>

<style>
    .bookish-footnote-focused {
        outline: 2px solid var(--bookish-highlight-color);
    }
</style>