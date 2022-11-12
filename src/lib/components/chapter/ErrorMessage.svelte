<script lang="ts">
    import type ErrorNode from "$lib/models/chapter/ErrorNode"

    export let node: ErrorNode;

</script>

<span class="bookish-error" data-nodeid={node.nodeID}>Error: {node.getError()}</span>