<script lang="ts">
    import type TableNode from "$lib/models/chapter/TableNode"
    import Format from './Format.svelte'
    import renderPosition from "./renderPosition"

    export let node: TableNode;

    let rows = node.getRows();
    let caption = node.getCaption();

</script>

<div class={"bookish-figure " + renderPosition(node.getPosition())} data-nodeid={node.nodeID}>
    <div class="bookish-table">
        <table>
            <tbody>
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
            </tbody>
        </table>
    </div>
    {#if caption !== undefined}
        <div class="bookish-figure-caption"><Format node={caption} placeholder="caption"/></div>
    {/if}
</div>