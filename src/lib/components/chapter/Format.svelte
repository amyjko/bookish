<svelte:options immutable={true} />

<script lang="ts">
    import FormatNode from '$lib/models/chapter/FormatNode';
    import CitationsNode from '$lib/models/chapter/CitationsNode';
    import CommentNode from '$lib/models/chapter/CommentNode';
    import DefinitionNode from '$lib/models/chapter/DefinitionNode';
    import FootnoteNode from '$lib/models/chapter/FootnoteNode';
    import InlineCodeNode from '$lib/models/chapter/InlineCodeNode';
    import LabelNode from '$lib/models/chapter/LabelNode';
    import LinkNode from '$lib/models/chapter/LinkNode';
    import TextNode from '$lib/models/chapter/TextNode';
    import Problem from './Problem.svelte';

    import Citations from './Citations.svelte';
    import Definition from './Definition.svelte';
    import Footnote from './Footnote.svelte';
    import InlineCode from './InlineCode.svelte';
    import Label from './Label.svelte';
    import Link from './Link.svelte';
    import Comment from './Comment.svelte';
    import Text from './Text.svelte';
    import Format from './Format.svelte';
    import { isChapterEditable } from '../page/Contexts';

    export let node: FormatNode;
    export let placeholder: string | undefined = undefined;

    let editable = isChapterEditable();

    $: format = node.getFormat();
    $: tag =
        format === '*'
            ? 'strong'
            : format === '_'
            ? 'em'
            : format === '^'
            ? 'sup'
            : format === 'v'
            ? 'sub'
            : 'span';

    $: showPlaceholder =
        node.isEmptyText() && placeholder !== undefined && editable;
</script>

<svelte:element
    this={tag}
    data-nodeid={node.nodeID}
    class={`format ${showPlaceholder ? 'bookish-editor-placeholder' : ''}`}
>
    {#each node.getSegments() as segment (segment.nodeID)}
        {#if segment instanceof TextNode}<Text
                node={segment}
                placeholder={node.getSegments().length === 1
                    ? placeholder
                    : undefined}
            />
        {:else if segment instanceof InlineCodeNode}<InlineCode
                node={segment}
            />
        {:else if segment instanceof LinkNode}<Link node={segment} />
        {:else if segment instanceof CitationsNode}<Citations node={segment} />
        {:else if segment instanceof DefinitionNode}<Definition
                node={segment}
            />
        {:else if segment instanceof FootnoteNode}<Footnote node={segment} />
        {:else if segment instanceof LabelNode}<Label node={segment} />
        {:else if segment instanceof CommentNode}<Comment node={segment} />
        {:else if segment instanceof FormatNode}<Format node={segment} />
        {:else}<Problem>Unknown segment type node={segment}</Problem>
        {/if}
    {/each}
</svelte:element>

<style>
    .bookish-editor-placeholder {
        color: var(--app-muted-color);
        font-style: italic;
    }

    strong,
    b {
        font-weight: var(--bookish-bold-font-weight);
    }
</style>
