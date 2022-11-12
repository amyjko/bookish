<script lang="ts">
    import ErrorNode from "$lib/models/chapter/ErrorNode";
    import FormatNode from "$lib/models/chapter/FormatNode";
    import type ReferenceNode from "$lib/models/chapter/ReferenceNode";
    import ErrorMessage from "../chapter/ErrorMessage.svelte";
    import Format from "../chapter/Format.svelte";
    import Reference from "./Reference.svelte";

    export let node: FormatNode | ErrorNode | ReferenceNode;
</script>


{#if node instanceof FormatNode}
    <Format node={node}/>
{:else if node instanceof ErrorNode}
    <ErrorMessage node={node}/>
{:else}
    <Reference node={node} />
{/if}