<script lang="ts">
    import type QuoteNode from "$lib/models/chapter/QuoteNode"
    import PositionEditor from "./PositionEditor.svelte";

    export let quote: QuoteNode;
</script>

<PositionEditor value={quote.getPosition()} edit={position => quote.withPosition(position)} />