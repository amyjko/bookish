<script lang="ts">
    import type BlockNode from "$lib/models/chapter/BlockNode";
    import CalloutNode from "$lib/models/chapter/CalloutNode";
    import CodeNode from "$lib/models/chapter/CodeNode";
    import EmbedNode from "$lib/models/chapter/EmbedNode";
    import ErrorNode from "$lib/models/chapter/ErrorNode";
    import ListNode from "$lib/models/chapter/ListNode";
    import ParagraphNode from "$lib/models/chapter/ParagraphNode";
    import QuoteNode from "$lib/models/chapter/QuoteNode";
    import RuleNode from "$lib/models/chapter/RuleNode";
    import TableNode from "$lib/models/chapter/TableNode";

    import Callout from "./Callout.svelte";
    import CaptionedCode from "./CaptionedCode.svelte";
    import Embed from "./Embed.svelte";
    import ErrorMessage from "./ErrorMessage.svelte";
    import List from "./List.svelte";
    import Paragraph from "./Paragraph.svelte";
    import Quote from "./Quote.svelte";
    import Rule from "./Rule.svelte";
    import Table from "./Table.svelte";

    export let node: BlockNode;

</script>

{#if node instanceof ParagraphNode}<Paragraph {node} />
{:else if node instanceof ListNode}<List {node} />
{:else if node instanceof EmbedNode}<Embed {node} />
{:else if node instanceof CalloutNode}<Callout {node} />
{:else if node instanceof QuoteNode}<Quote {node} />
{:else if node instanceof CodeNode}<CaptionedCode {node} />
{:else if node instanceof ErrorNode}<ErrorMessage {node} />
{:else if node instanceof RuleNode}<Rule {node} />
{:else if node instanceof TableNode}<Table {node} />
{:else}<p class="bookish-error">Unknown node type</p>
{/if}