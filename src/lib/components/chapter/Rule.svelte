<script lang="ts">
    import type RuleNode from '$lib/models/chapter/RuleNode';

    export let node: RuleNode;
</script>

<hr data-nodeid={node.nodeID} />

<style>
    hr {
        border: none;
        border-bottom: 1px solid var(--bookish-border-color-light);
        margin-top: calc(var(--bookish-paragraph-spacing) * 3);
        margin-bottom: calc(var(--bookish-paragraph-spacing) * 3);
    }
</style>
