<script lang="ts">
    import ListNode from "$lib/models/chapter/ListNode";
    import Format from "./Format.svelte";

    export let node: ListNode;

</script>

<svelte:element this={node.isNumbered() ? "ol" : "ul"} data-nodeid={node.nodeID}>
    {#each node.getItems() as item }
        {#if item instanceof ListNode }
            <svelte:self node={item}/>
        {:else}
            <li><Format node={item}/></li>
        {/if}
    {/each}
</svelte:element>