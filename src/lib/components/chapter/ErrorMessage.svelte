<script lang="ts">
    import type ErrorNode from '#lib/models/chapter/ErrorNode.js';
    import Problem from './Problem.svelte';

    interface Props {
        node: ErrorNode;
    }

    let { node }: Props = $props();
</script>

<Problem
    ><span data-nodeid={node.nodeID}>Error: {node.getError()}</span></Problem
>
