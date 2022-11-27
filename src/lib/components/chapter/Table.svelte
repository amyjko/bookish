<script lang="ts">
    import type TableNode from "$lib/models/chapter/TableNode"
    import Figure from "./Figure.svelte";
    import Format from './Format.svelte'
    import Rows from "../page/Rows.svelte";

    export let node: TableNode;

    $: rows = node.getRows();

</script>

<Figure {node} caption={node.getCaption()}>
    <Rows>
        {#each rows as row }
            <tr>
                {#if row.length === 1 }
                    <td colspan={rows.reduce((max, row) => Math.max(row.length, max), 0)}><Format node={row[0]}/></td>
                {:else}
                    {#each row as cell }
                        <td><Format node={cell}/></td>
                    {/each}
                {/if}
            </tr>
        {/each}
    </Rows>
</Figure>