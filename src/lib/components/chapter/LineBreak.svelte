<svelte:options immutable={true} />

<script lang="ts">
    import type LineBreakNode from '$lib/models/chapter/LineBreakNode';

    export let node: LineBreakNode;
</script>

<br data-nodeid={node.nodeID} />
