<svelte:options immutable={true} />

<script lang="ts">
    import type TableNode from '$lib/models/chapter/TableNode';
    import Figure from './Figure.svelte';
    import Format from './Format.svelte';
    import Rows from '../page/Rows.svelte';
    import { isEditable } from '../page/Contexts';

    export let node: TableNode;

    let editable = isEditable();
    $: rows = node.getRows();
</script>

<Figure {node} caption={node.getCaption()}>
    <Rows>
        {#each rows as row, index}
            <tr class={editable ? 'editable' : null}>
                {#if row.length === 1}
                    <svelte:element this={index === 0 ? 'th' : 'td'}>
                        colspan={rows.reduce(
                            (max, row) => Math.max(row.length, max),
                            0
                        )}><Format node={row[0]} /></svelte:element
                    >
                {:else}
                    {#each row as cell}
                        <svelte:element this={index === 0 ? 'th' : 'td'}
                            ><Format node={cell} /></svelte:element
                        >
                    {/each}
                {/if}
            </tr>
        {/each}
    </Rows>
</Figure>

<style>
    tr.editable td,
    tr.editable th {
        border: 1px dotted var(--app-border-color);
    }
</style>
