<script lang="ts">
    import type CommentNode from '$lib/models/chapter/CommentNode'
    import Atom from './Atom.svelte';
    import Marginal from './Marginal.svelte';
    import Format from './Format.svelte';
    import { EDITABLE, getChapter } from '../page/Contexts';
    import { getCaret } from '../page/Contexts';
    import { afterUpdate, getContext } from 'svelte';
    import ToolbarIcon from '../editor/ToolbarIcon.svelte';

    export let node: CommentNode;
    
    let chapter = getChapter();
    let editable = getContext<boolean>(EDITABLE);
    let caret = getCaret();
    $: chapterNode = $chapter.chapter.getAST();

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