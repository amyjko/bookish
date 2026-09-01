<script lang="ts">
    import type LabelNode from '$lib/models/chapter/LabelNode';
    import Atom from '$lib/components/chapter/Atom.svelte';
    import { getChapter, getRoot, isChapterEditable } from '../page/Contexts';
    import Problem from './Problem.svelte';

    interface Props {
        node: LabelNode;
    }

    let { node }: Props = $props();

    let editable = isChapterEditable();
    let chapter = getChapter();
    let root = getRoot();

    let duplicate =
        $derived($root === undefined
            ? false
            : $root.getLabels().filter((l) => l.getMeta() === node.getMeta())
                  .length > 1);
</script>

<Atom {node}>
    <span
        class={'bookish-label' +
            ($chapter?.highlightedID === node.getMeta()
                ? ' bookish-content-highlight'
                : '')}
        id={node.getMeta()}
        data-nodeid={node.nodeID}
    >
        {#if editable}
            {#if duplicate}
                <Problem>Duplicate label {node.getMeta()}</Problem>
            {:else}
                <span>•<code>{node.getMeta()}</code></span>
            {/if}
        {/if}
    </span>
</Atom>

<style>
    /* A little circle at the point of the annotation */
    .bookish-label.bookish-content-highlight {
        display: inline-block;
        width: 3em;
        height: 3em;
        border-radius: 3em;
        position: absolute;
        z-index: -1;
        margin-left: -1em;
    }
</style>
