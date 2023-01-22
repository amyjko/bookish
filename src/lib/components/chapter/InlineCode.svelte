<svelte:options immutable={true} />

<script lang="ts">
    import type InlineCodeNode from '$lib/models/chapter/InlineCodeNode';
    import { isChapterEditable } from '../page/Contexts';
    import Code from './Code.svelte';
    import Text from './Text.svelte';

    export let node: InlineCodeNode;

    let editable = isChapterEditable();
</script>

{#if editable}
    <span
        class="bookish-code bookish-code-inline hljs"
        data-nodeid={node.nodeID}><Text node={node.getText()} /></span
    >
{:else}
    <Code
        editable={false}
        inline={true}
        language={node.getMeta()}
        nodeID={node.getText().nodeID}>{node.getText().getText()}</Code
    >
{/if}
