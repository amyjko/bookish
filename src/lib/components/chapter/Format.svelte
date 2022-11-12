<script lang="ts">
    import { getContext } from "svelte";
    import FormatNode from "$lib/models/chapter/FormatNode";
    import CitationsNode from "$lib/models/chapter/CitationsNode";
    import CommentNode from "$lib/models/chapter/CommentNode";
    import DefinitionNode from "$lib/models/chapter/DefinitionNode";
    import FootnoteNode from "$lib/models/chapter/FootnoteNode";
    import InlineCodeNode from "$lib/models/chapter/InlineCodeNode";
    import LabelNode from "$lib/models/chapter/LabelNode";
    import LinkNode from "$lib/models/chapter/LinkNode";
    import TextNode from "$lib/models/chapter/TextNode";

    import Citations from "./Citations.svelte";
    import Definition from "./Definition.svelte";
    import Footnote from "./Footnote.svelte";
    import InlineCode from "./InlineCode.svelte";
    import Label from "./Label.svelte";
    import Link from "./Link.svelte";
    import Comment from "./Comment.svelte";
    import Text from "./Text.svelte";
    import Format from "./Format.svelte";

    import { EDITABLE } from "../page/Symbols";

    export let node: FormatNode;
    export let placeholder: string | undefined = undefined;

    let editable = getContext(EDITABLE);

    $: format = node.getFormat();
    $: tag = 
        format === "*" ? "strong" :
        format === "_" ? "em" :
        format === "^" ? "sup" :
        format === "v" ? "sub" :
        "span";

    $: showPlaceholder = node.isEmptyText() && placeholder !== undefined && editable;

</script>

<svelte:element this={tag} data-nodeid={node.nodeID} class={showPlaceholder ? "bookish-editor-placeholder" : ""}>
    {#each node.getSegments() as segment}
        {#if segment instanceof TextNode}<Text node={segment} />
        {:else if segment instanceof InlineCodeNode}<InlineCode node={segment} />
        {:else if segment instanceof LinkNode}<Link node={segment} />
        {:else if segment instanceof CitationsNode}<Citations node={segment} />
        {:else if segment instanceof DefinitionNode}<Definition node={segment} />
        {:else if segment instanceof FootnoteNode}<Footnote node={segment} />
        {:else if segment instanceof LabelNode}<Label node={segment} />
        {:else if segment instanceof CommentNode}<Comment node={segment} />
        {:else if segment instanceof FormatNode}<Format node={segment} />
        {:else}<span class="bookish-error">Unknown segment type node={segment}</span>
        {/if}
    {/each}
    {#if showPlaceholder }
        { placeholder }
    {/if}
</svelte:element>