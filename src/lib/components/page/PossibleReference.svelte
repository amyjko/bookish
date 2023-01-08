<script lang="ts">
    import ErrorNode from '$lib/models/chapter/ErrorNode';
    import FormatNode from '$lib/models/chapter/FormatNode';
    import type Ref from '$lib/models/book/Reference';
    import ErrorMessage from '../chapter/ErrorMessage.svelte';
    import Format from '../chapter/Format.svelte';
    import Reference from './Reference.svelte';

    export let node: FormatNode | ErrorNode | Ref;
</script>

{#if node instanceof FormatNode}
    <Format {node} />
{:else if node instanceof ErrorNode}
    <ErrorMessage {node} />
{:else}
    <Reference reference={node} />
{/if}
