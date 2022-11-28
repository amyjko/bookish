<script lang="ts">
    import type QuoteNode from "$lib/models/chapter/QuoteNode"
    import { getCaret } from "../page/Contexts";
    import PositionEditor from "./PositionEditor.svelte";

    export let quote: QuoteNode;

    let caret = getCaret();
    
</script>

<PositionEditor value={quote.getPosition()} edit={position => $caret?.edit(quote, quote.withPosition(position))} />