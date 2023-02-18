<script lang="ts">
    import FormatNode from '$lib/models/chapter/FormatNode';
    import type Ref from '$lib/models/book/Reference';
    import Format from '../chapter/Format.svelte';
    import Reference from './Reference.svelte';

    export let node: FormatNode | Ref;
    export let edit: boolean;
</script>

{#if node instanceof FormatNode}
    <Format {node} />
{:else}
    <Reference reference={node} {edit} />
{/if}
