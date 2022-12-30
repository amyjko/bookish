<script lang="ts">
    import type CalloutNode from '$lib/models/chapter/CalloutNode';
    import PositionEditor from './PositionEditor.svelte';
    import { getCaret } from '../page/Contexts';

    export let callout: CalloutNode;

    let caret = getCaret();
</script>

<PositionEditor
    value={callout.getPosition()}
    edit={(position) => $caret?.edit(callout, callout.withPosition(position))}
/>
