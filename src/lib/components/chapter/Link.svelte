<svelte:options immutable={true} />

<script lang="ts">
    import type LinkNode from '$lib/models/chapter/LinkNode';
    import { getBase, getEdition, isChapterEditable } from '../page/Contexts';
    import Text from './Text.svelte';
    import Problem from './Problem.svelte';

    export let node: LinkNode;

    let base = getBase();
    let editable = isChapterEditable();
    let edition = getEdition();

    $: url = node.getMeta();
    $: content = node.getText();

    function isInvalidChapterLink() {
        // If it's internal, validate it.
        if (!url.startsWith('http')) {
            // Pull out any labels and just get the chapter name.
            let chapter = url;
            if (url.indexOf(':') >= 0) {
                let parts = chapter.split(':');
                chapter = parts[0];
            } else if (url.indexOf('#') >= 0) {
                let parts = chapter.split('#');
                chapter = parts[0];
            }

            if (chapter !== '' && !$edition?.hasChapter(chapter)) return true;
        }
        return false;
    }
</script>

{#if editable}
    <span class="bookish-editor-link"><Text node={content} /></span>
    <!-- If this is an invalid chapter link, say so -->
{:else if isInvalidChapterLink()}
    <Problem>Unknown chapter name reference '{url}'</Problem>
    <!-- If this is external link, make an anchor that opens a new window. -->
{:else if url.startsWith('http')}
    <a href={url} target="_blank" rel="noreferrer"><Text node={content} /></a>
    <!-- If's a chapter link with a label -->
{:else if url.indexOf(':') >= 0}
    {#if url.split(':')[0] === ''}
        <!-- If the chapter isn't specified, assume this chapter. -->
        <a href={'#' + url.split(':')[1]}><Text node={content} /></a>
    {:else}
        <!-- If it is specified, include the base relative chapter ID and the label -->
        <a href={`${$base}/${url.split(':')[0]}#${url.split(':')[1]}`}
            ><Text node={content} /></a
        >
    {/if}
{:else}
    <!-- If this is internal link, make a route link to the chapter. -->
    <a href={`${$base}/${url}`}><Text node={content} /></a>
{/if}

<style>
    a,
    .bookish-editor-link {
        color: var(--bookish-link-color);
        font-weight: var(--bookish-link-font-weight);
    }
</style>
