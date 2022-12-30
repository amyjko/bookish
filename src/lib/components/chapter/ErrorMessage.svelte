<script lang="ts">
    import type ErrorNode from '$lib/models/chapter/ErrorNode';
    import Problem from './Problem.svelte';

    export let node: ErrorNode;
</script>

<Problem data-nodeid={node.nodeID}>Error: {node.getError()}</Problem>
