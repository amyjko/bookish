<script lang="ts">
    import type CommentNode from '$lib/models/chapter/CommentNode';
    import Atom from './Atom.svelte';
    import Marginal from './Marginal.svelte';
    import Format from './Format.svelte';
    import {
        getChapter,
        isChapterEditable,
        getCaret,
        getRoot,
    } from '$lib/components/page/Contexts';
    import Icon from '../editor/Icon.svelte';
    import CommentIcon from '../editor/icons/comment.svg?raw';

    interface Props {
        node: CommentNode;
    }

    let { node }: Props = $props();

    let chapter = getChapter();
    let editable = isChapterEditable();
    let root = getRoot();
    let caret = getCaret();

    let focused = $derived(
        $caret && $caret.range && node.contains($caret.range.start.node),
    );

    // Whenever anything that affects this comment's rendered size or
    // position changes, request a chapter-wide marginal layout pass.
    $effect(() => {
        void node;
        void focused;
        $chapter?.requestLayout();
    });
</script>

<Atom {node}>
    {#if editable}
        <Marginal
            {node}
            id={'comment-' +
                ($root === undefined ? '?' : $root.getComments().indexOf(node))}
            label="comment, escape to edit"
        >
            {#snippet interactor()}
                <span class="bookish-comment-symbol">
                    <Icon icon={CommentIcon} />
                </span>
            {/snippet}
            {#snippet content()}
                <span class={`comment ${focused ? 'comment-focused' : ''}`}>
                    <Format node={node.getMeta()} placeholder="comment" />
                </span>
            {/snippet}
        </Marginal>
    {/if}
</Atom>

<style>
    .comment {
        background: var(--app-chrome-background);
        border: var(--app-chrome-border-size) solid var(--app-border-color);
        border-radius: 0 var(--app-chrome-padding) var(--app-chrome-padding)
            var(--app-chrome-padding);
        padding: var(--app-chrome-padding);
        font-size: var(--app-chrome-font-size);
        display: inline-block;
        line-height: 1.5em;
    }

    .comment-focused,
    .bookish-footnote-focused {
        outline: 2px solid var(--bookish-highlight-color);
    }

    .bookish-comment-symbol {
        position: relative;
    }
</style>
