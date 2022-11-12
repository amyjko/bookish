<script lang="ts">
    import type CommentNode from '$lib/models/chapter/CommentNode'
    import Atom from './Atom.svelte';
    import Marginal from './Marginal.svelte';
    import Format from './Format.svelte';
    import { CARET, CHAPTER, EDITABLE } from '../page/Symbols';
    import { getContext } from 'svelte';
    import type ChapterContext from '../page/ChapterContext';
    import type CaretContext from '../editor/CaretContext';

    export let node: CommentNode;
    
    let context = getContext<ChapterContext>(CHAPTER);
    let editable = getContext<boolean>(EDITABLE);
    let caret = getContext<CaretContext>(CARET);
    $: chapterNode = context.chapter.getAST();

    $: focused = caret?.range && node.contains(caret.range.start.node);

</script>

<Atom {node}>
    {#if editable}
        <Marginal id={"comment-" + (chapterNode === undefined ? "?" : chapterNode.getComments().indexOf(node))}>
            <span slot="interactor" class="bookish-comment-symbol">
                <img src="/svg/comment.svg"/>
            </span>
            <span slot="content" class={`bookish-app-comment ${focused ? "bookish-app-comment-focused" : ""}`}>
                <Format node={node.getMeta()} placeholder="comment"/>
            </span>
        </Marginal>
    {/if}
</Atom>