<script lang="ts">
    import type CalloutNode from "$lib/models/chapter/CalloutNode"
    import type CaretContext from '$lib/components/editor/CaretContext';
    import PositionEditor from "./PositionEditor.svelte";
    import { CARET } from '../page/Symbols';
    import { getContext } from "svelte";

    export let callout: CalloutNode;

    let caret = getContext<CaretContext>(CARET);

</script>

<PositionEditor 
    value={callout.getPosition()} 
    edit={position => caret?.edit(callout, callout.withPosition(position))}
/>