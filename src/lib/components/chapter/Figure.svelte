<svelte:options immutable={true} />

<script lang="ts">
    import type TableNode from '$lib/models/chapter/TableNode';
    import type EmbedNode from '$lib/models/chapter/EmbedNode';
    import Format from './Format.svelte';
    import type CodeNode from '$lib/models/chapter/CodeNode';
    import type FormatNode from '$lib/models/chapter/FormatNode';
    import Positioned from './Positioned.svelte';
    import { getCaret, isChapterEditable } from '../page/Contexts';

    export let node: TableNode | EmbedNode | CodeNode;
    export let caption: FormatNode | undefined;
    export let credit: FormatNode | undefined = undefined;
    export let focusable: boolean = true;

    let editable = isChapterEditable();
    let caret = getCaret();

    $: selected = $caret?.range?.start.node === node;

    function focusFigure() {
        if (!editable || $caret === undefined) return;
        // if (node instanceof EmbedNode) {
        //     return $caret.setCaret({
        //         start: { node, index: 0 },
        //         end: { node, index: 0 },
        //     });
        // } else {
        const firstCaret = node.getFirstCaret();
        if (firstCaret)
            $caret.setCaret({
                start: firstCaret,
                end: firstCaret,
            });
        // }
    }
</script>

<Positioned position={node.getPosition()}>
    <figure class="bookish-figure" data-nodeid={node.nodeID}>
        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
        <div
            class:selected
            role={focusable ? 'button' : undefined}
            tabindex={focusable ? 0 : undefined}
            on:mousedown={focusable ? focusFigure : null}
            on:keydown={(event) =>
                event.key === ' ' || event.key === 'Enter'
                    ? focusFigure()
                    : null}
        >
            <slot />
        </div>
        {#if caption !== undefined}
            <figcaption class="caption">
                {#if caption}
                    <Format node={caption} placeholder="caption" />
                {/if}
                {#if credit}
                    <aside class="credit">
                        <Format node={credit} placeholder="credit" />
                    </aside>
                {/if}
            </figcaption>
        {/if}
    </figure>
</Positioned>

<style>
    figure {
        margin: 0;
        margin-block-start: 0;
        margin-block-end: 0;
        margin-inline-start: 0;
        margin-inline-end: 0;
    }

    .selected {
        filter: opacity(50%);
    }

    .caption {
        text-align: center;
        color: var(--bookish-muted-color);
        line-height: var(--bookish-paragraph-line-height-tight);
        font-size: var(--bookish-block-font-size);
        margin-top: var(--bookish-block-padding);
        margin-bottom: var(--bookish-block-padding);
    }

    .credit {
        display: block;
        position: absolute;
        top: calc(-1.2 * var(--bookish-block-padding));
        right: var(--bookish-block-padding);
        text-align: right;
        font-style: italic;
        font-size: var(--bookish-small-font-size);
    }

    figcaption {
        position: relative;
    }
</style>
