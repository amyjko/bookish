<script lang="ts">
    import type LineBreakNode from '$lib/models/chapter/LineBreakNode';

    interface Props {
        node: LineBreakNode;
    }

    let { node }: Props = $props();
</script>

<br data-nodeid={node.nodeID} />
