<script lang="ts">
    import type BlockNode from '#lib/models/chapter/BlockNode.js';
    import CalloutNode from '#lib/models/chapter/CalloutNode.js';
    import CodeNode from '#lib/models/chapter/CodeNode.js';
    import EmbedNode from '#lib/models/chapter/EmbedNode.js';
    import ErrorNode from '#lib/models/chapter/ErrorNode.js';
    import ListNode from '#lib/models/chapter/ListNode.js';
    import ParagraphNode from '#lib/models/chapter/ParagraphNode.js';
    import QuoteNode from '#lib/models/chapter/QuoteNode.js';
    import RuleNode from '#lib/models/chapter/RuleNode.js';
    import TableNode from '#lib/models/chapter/TableNode.js';

    import Callout from './Callout.svelte';
    import CaptionedCode from './CaptionedCode.svelte';
    import Embed from './Embed.svelte';
    import ErrorMessage from './ErrorMessage.svelte';
    import List from './List.svelte';
    import Paragraph from './Paragraph.svelte';
    import Quote from './Quote.svelte';
    import Rule from './Rule.svelte';
    import Table from './Table.svelte';
    import Problem from './Problem.svelte';
    import { isChapterEditable } from '../page/Contexts';

    interface Props {
        node: BlockNode;
    }

    let { node }: Props = $props();

    let editable = isChapterEditable();
</script>

{#if node instanceof ParagraphNode}<Paragraph {node} />
{:else if node instanceof ListNode}<List {node} />
{:else if node instanceof EmbedNode}<Embed {node} {editable} />
{:else if node instanceof CalloutNode}<Callout {node} />
{:else if node instanceof QuoteNode}<Quote {node} />
{:else if node instanceof CodeNode}<CaptionedCode {node} />
{:else if node instanceof ErrorNode}<ErrorMessage {node} />
{:else if node instanceof RuleNode}<Rule {node} />
{:else if node instanceof TableNode}<Table {node} />
{:else}<p><Problem>Unknown node type</Problem></p>
{/if}
