<script lang="ts">

    import type TableNode from "$lib/models/chapter/TableNode";
    import type EmbedNode from "$lib/models/chapter/EmbedNode";
    import Format from "./Format.svelte";
    import renderPosition from "./renderPosition";
    import type CodeNode from "$lib/models/chapter/CodeNode";
    import type FormatNode from "$lib/models/chapter/FormatNode";

    export let node: TableNode | EmbedNode | CodeNode;
    export let caption: FormatNode;
    export let credit: FormatNode | undefined = undefined;

</script>

<div class="bookish-figure {renderPosition(node.getPosition())}" data-nodeid={node.nodeID}>
    <slot></slot>
    {#if caption !== undefined}
        <div class="bookish-figure-caption">
            {#if credit}
                <div class="bookish-figure-credit">
                    <Format node={credit} placeholder="credit" />
                </div>
            {/if}
            <Format node={caption} placeholder="caption"/>
        </div>
    {/if}
</div>

<style>
    .bookish-figure-caption {
        text-align: center;
        color: var(--bookish-muted-color);
        line-height: var(--bookish-paragraph-line-height-tight);
        font-size: var(--bookish-block-font-size);
        margin-top: 0;
        margin-bottom: var(--bookish-paragraph-spacing);
        margin-left: var(--bookish-paragraph-spacing);
        margin-right: var(--bookish-paragraph-spacing);
    }

    .bookish-figure-credit {
        display: block;
        text-align: right;
        font-style: italic;
        font-size: var(--bookish-small-font-size);
    }

</style>