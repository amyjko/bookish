<script lang="ts">

    import type ChapterNode from "$lib/models/chapter/ChapterNode"
    import ParagraphNode from '$lib/models/chapter/ParagraphNode'
    import Block from "./Block.svelte"
    import Paragraph from './Paragraph.svelte'

    export let node: ChapterNode;
    export let placeholder: string = "";

    $: errors = node.getErrors();
    $: blocks = node.getBlocks();

</script>

<div class="bookish-chapter-body" data-nodeid={node.nodeID}>
    {#if errors.length > 0 }
        <p>
            <span class="bookish-error">{errors.length + " " + (errors.length > 1 ? "errors" : "error")} below</span>
        </p>
    {/if}
    {#if blocks.length === 1 && blocks[0] instanceof ParagraphNode && blocks[0].getFormat().isEmptyText() }
        <Paragraph node={blocks[0]} placeholder={placeholder} />
    {:else}
        {#each node.getBlocks() as block }
            <Block node={block} />
        {/each}
    {/if}
</div>