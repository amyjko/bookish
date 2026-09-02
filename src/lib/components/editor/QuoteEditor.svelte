<script lang="ts">
    import type QuoteNode from '$lib/models/chapter/QuoteNode';
    import { getCaret } from '$lib/components/page/Contexts';
    import PositionEditor from './PositionEditor.svelte';

    interface Props {
        quote: QuoteNode;
    }

    let { quote }: Props = $props();

    let caret = getCaret();
</script>

<PositionEditor
    value={quote.getPosition()}
    edit={(position) => $caret?.edit(quote, quote.withPosition(position))}
/>
