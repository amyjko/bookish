<script lang="ts">
    import type TableNode from '$lib/models/chapter/TableNode';
    import { getCaret } from '$lib/components/page/Contexts';
    import PositionEditor from './PositionEditor.svelte';

    export let table: TableNode;

    let caret = getCaret();
</script>

<PositionEditor
    value={table.getPosition()}
    edit={(position) => $caret?.edit(table, table.withPosition(position))}
/>
