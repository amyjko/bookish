<script lang="ts">
    import type TableNode from "$lib/models/chapter/TableNode"
    import Figure from "./Figure.svelte";
    import Format from './Format.svelte'

    export let node: TableNode;

    $: rows = node.getRows();

</script>

<Figure {node} caption={node.getCaption()}>
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
</Figure>

<style>

    .bookish-chapter .bookish-table tbody tr:first-child {
        border: 0;
        background-color: var(--bookish-border-color-light);
    }

    .bookish-chapter .bookish-table tbody tr:first-child td {
        font-weight: bold;
        border: 0;
        border-bottom: 1px solid var(--bookish-border-color-light);
    }

    .bookish-chapter .bookish-table tbody tr:nth-child(even) {
        background-color: var(--bookish-block-background-color);
    }

    .bookish-chapter table tr:last-child td:first-child {
        border-bottom-left-radius: var(--bookish-roundedness);
    }
    .bookish-chapter table tr:last-child td:last-child {
        border-bottom-right-radius: var(--bookish-roundedness);
    }
    .bookish-chapter table tr:first-child td:first-child {
        border-top-left-radius: var(--bookish-roundedness);
    }
    .bookish-chapter table tr:first-child td:last-child {
        border-top-right-radius: var(--bookish-roundedness);
    }

    .bookish-chapter .bookish-table td {
        font-size: var(--bookish-block-font-size);
        border: 0;
    }

</style>