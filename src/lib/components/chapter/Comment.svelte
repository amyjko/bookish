<svelte:options immutable={true} />

<script lang="ts">
    import type CommentNode from '$lib/models/chapter/CommentNode';
    import Atom from './Atom.svelte';
    import Marginal from './Marginal.svelte';
    import Format from './Format.svelte';
    import {
        getChapter,
        isChapterEditable,
        getCaret,
        getEdition,
        getRoot,
    } from '$lib/components/page/Contexts';
    import { afterUpdate } from 'svelte';
    import Icon from '../editor/Icon.svelte';
    import CommentIcon from '../editor/icons/comment.svg?raw';

    export let node: CommentNode;

    let chapter = getChapter();
    let edition = getEdition();
    let editable = isChapterEditable();
    let root = getRoot();

    let caret = getCaret();

    $: focused =
        $caret && $caret.range && node.contains($caret.range.start.node);

    // Position the marginals on every render.
    afterUpdate(() => $chapter?.layoutMarginals());
</script>

<Atom {node}>
    {#if editable}
        <Marginal
            {node}
            id={'comment-' +
                ($root === undefined ? '?' : $root.getComments().indexOf(node))}
            label="comment, escape to edit"
        >
            <span slot="interactor" class="bookish-comment-symbol">
                <Icon icon={CommentIcon} />
            </span>
            <span
                slot="content"
                class={`bookish-app-comment ${
                    focused ? 'bookish-app-comment-focused' : ''
                }`}
            >
                <Format node={node.getMeta()} placeholder="comment" />
            </span>
        </Marginal>
    {/if}
</Atom>

<style>
    .bookish-app-comment {
        background: var(--app-chrome-background);
        border: var(--app-chrome-border-size) solid var(--app-border-color);
        border-radius: 0 var(--app-chrome-padding) var(--app-chrome-padding)
            var(--app-chrome-padding);
        padding: var(--app-chrome-padding);
        font-size: var(--app-chrome-font-size);
        display: inline-block;
        line-height: 1.5em;
    }

    .bookish-app-comment-focused,
    .bookish-footnote-focused {
        outline: 2px solid var(--bookish-highlight-color);
    }

    .bookish-comment-symbol {
        position: relative;
    }
</style>
