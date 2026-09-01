<script lang="ts">
    import type CalloutNode from '$lib/models/chapter/CalloutNode';
    import PositionEditor from './PositionEditor.svelte';
    import { getCaret } from '$lib/components/page/Contexts';

    interface Props {
        callout: CalloutNode;
    }

    let { callout }: Props = $props();

    let caret = getCaret();
</script>

<PositionEditor
    value={callout.getPosition()}
    edit={(position) => $caret?.edit(callout, callout.withPosition(position))}
/>
