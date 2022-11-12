<script lang="ts">
    import type CommentNode from '$lib/models/chapter/CommentNode'
    import Atom from './Atom.svelte';
    import Marginal from './Marginal.svelte';
    import Format from './Format.svelte';
    import { getChapter, isEditable } from '../page/Contexts';
    import { getCaret } from '../page/Contexts';
    import { afterUpdate } from 'svelte';
    import ToolbarIcon from '../editor/ToolbarIcon.svelte';

    export let node: CommentNode;
    
    let chapter = getChapter();
    let editable = isEditable();
    let caret = getCaret();

    $: chapterNode = $chapter?.chapter.getAST();
    $: focused = $caret && $caret.range && node.contains($caret.range.start.node);

    // Position the marginals on every render.
    afterUpdate(() => $chapter?.layoutMarginals());

</script>

<Atom {node}>
    {#if editable}
        <Marginal id={"comment-" + (chapterNode === undefined ? "?" : chapterNode.getComments().indexOf(node))}>
            <span slot="interactor" class="bookish-comment-symbol">
                <ToolbarIcon name="comment.svg"/>
            </span>
            <span slot="content" class={`bookish-app-comment ${focused ? "bookish-app-comment-focused" : ""}`}>
                <Format node={node.getMeta()} placeholder="comment"/>
            </span>
        </Marginal>
    {/if}
</Atom>

<style>
    .bookish-app-comment {
        background: var(--bookish-app-chrome-background);
        border: var(--bookish-app-chrome-border-width) solid var(--bookish-app-chrome-border-color);
        border-radius: 0 var(--bookish-app-chrome-padding) var(--bookish-app-chrome-padding) var(--bookish-app-chrome-padding);
        padding: var(--bookish-app-chrome-padding);
        font-size: var(--bookish-app-chrome-font-size);
        display: inline-block;
        line-height: 1.5em;
    }

    .bookish-app-comment-focused, .bookish-footnote-focused {
        outline: 2px solid var(--bookish-highlight-color);
    }

</style>