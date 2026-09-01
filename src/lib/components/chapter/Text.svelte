<script lang="ts">
    import type TextNode from '$lib/models/chapter/TextNode';
    import { getChapter, isChapterEditable } from '../page/Contexts';

    interface Props {
        node: TextNode;
        placeholder?: string | undefined;
    }

    let { node, placeholder = undefined }: Props = $props();

    let context = getChapter();
    let editable = isChapterEditable();

    function replaceMultipleSpacesWithNonBreakingSpaces(original: string) {
        let revisedText = '';
        for (let i = 0; i < original.length; i++) {
            // If its a space and its at the beginning, the end, or the previous character was a space, make it a non-breaking space.
            let c = original.charAt(i);
            if (
                c === ' ' &&
                (i === 0 ||
                    i === original.length - 1 ||
                    original.charAt(i - 1) === ' ')
            )
                revisedText += ' ';
            else revisedText += c;
        }
        return revisedText;
    }

    // Manipulate text for rendering.
    let text = $derived.by(() => {
        // Replace any spaces at the beginning or end of the string with explicit non-breaking spaces to ensure that they render.
        let revised = replaceMultipleSpacesWithNonBreakingSpaces(
            node.getText(),
        );

        // If the text ends with a newline, render a non-breaking space at the end.
        if (revised.length > 0 && revised.charAt(revised.length - 1) === '\n')
            revised = revised + '﻿';

        // If there's no text, render a non-breaking space, or a placeholder if provided.
        if (revised.length === 0) revised = placeholder ?? '﻿';

        return revised;
    });

    // Compute highlights, if highlighted
    let segments: [string, boolean][] | undefined = $derived.by(() => {
        if (editable) return undefined;

        // Is there a query we're supposed to highlight? If so, highlight it.
        if (!$context || !$context.highlightedWord) return undefined;

        const query = $context.highlightedWord;
        const lowerText = text.toLowerCase();

        // Does this text contain the query? Highlight it.
        if (lowerText.indexOf(query) < 0) return undefined;

        // Find all the matches
        const indices = [];
        for (let i = 0; i < text.length; ++i) {
            if (lowerText.substring(i, i + query.length) === query) {
                indices.push(i);
            }
        }

        // Go through each one and construct contents for the span to return.
        const list: [string, boolean][] = [];
        for (let i = 0; i < indices.length; i++) {
            // Push the text from the end of the last match or the start of the string.
            list.push([
                text.substring(
                    i === 0 ? 0 : indices[i - 1] + query.length,
                    indices[i],
                ),
                false,
            ]);
            list.push([
                text.substring(indices[i], indices[i] + query.length),
                true,
            ]);
        }
        if (indices[indices.length - 1] < text.length - 1)
            list.push([
                text.substring(
                    indices[indices.length - 1] + query.length,
                    text.length,
                ),
                false,
            ]);
        return list;
    });
</script>

{#if segments}
    {#each segments as segment}
        <span
            class={`bookish-text ${
                segment[1] ? 'bookish-content-highlight' : ''
            }`}>{segment[0]}</span
        >
    {/each}
{:else}
    <span class={'bookish-text'} data-nodeid={node.nodeID}>{text}</span>
{/if}
