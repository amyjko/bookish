<script lang="ts">
    import type TableNode from '$lib/models/chapter/TableNode';
    import type EmbedNode from '$lib/models/chapter/EmbedNode';
    import Format from './Format.svelte';
    import type CodeNode from '$lib/models/chapter/CodeNode';
    import type FormatNode from '$lib/models/chapter/FormatNode';
    import Positioned from './Positioned.svelte';

    export let node: TableNode | EmbedNode | CodeNode;
    export let caption: FormatNode | undefined;
    export let credit: FormatNode | undefined = undefined;
</script>

<Positioned position={node.getPosition()}>
    <figure class="bookish-figure" data-nodeid={node.nodeID}>
        <slot />
        {#if caption !== undefined}
            <figcaption class="bookish-figure-caption">
                {#if caption}
                    <Format node={caption} placeholder="caption" />
                {/if}
                {#if credit}
                    <div class="bookish-figure-credit">
                        <Format node={credit} placeholder="credit" />
                    </div>
                {/if}
            </figcaption>
        {/if}
    </figure>
</Positioned>

<style>
    figure {
        margin: 0;
    }

    .bookish-figure-caption {
        text-align: center;
        position: relative;
        color: var(--bookish-muted-color);
        line-height: var(--bookish-paragraph-line-height-tight);
        font-size: var(--bookish-block-font-size);
        margin-top: var(--bookish-block-padding);
        margin-bottom: var(--bookish-block-padding);
    }

    .bookish-figure-credit {
        display: block;
        position: absolute;
        top: -1em;
        right: 0;
        text-align: right;
        font-style: italic;
        font-size: var(--bookish-small-font-size);
    }
</style>
