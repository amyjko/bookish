<script lang="ts">
    import type TextNode from "$lib/models/chapter/TextNode";
    import { getCaret, getChapter, isEditable } from "../page/Contexts";

    export let node: TextNode;
    export let placeholder: string | undefined = undefined; 

    $: text = node.getText();

    let context = getChapter();
    let editable = isEditable();
    let caret = getCaret();

    function replaceMultipleSpacesWithNonBreakingSpaces(original: string) {
        let revisedText = ""
        for(let i = 0; i < original.length; i++) {
            // If its a space and its at the beginning, the end, or the previous character was a space, make it a non-breaking space.
            let c = original.charAt(i)
            if(c === " " && (i === 0 || i === original.length - 1 || original.charAt(i - 1) === " "))
                revisedText += "\u00a0";
            else revisedText += c
        }
        return revisedText;
    }

    // Compute highlights, if highlighted
    let segments: [string, boolean][] | undefined = undefined;
    $: {   

        segments = undefined;

        if(!editable || ($caret?.range?.start.node !== node)) {

            // Replace any spaces at the beginning or end of the string with explicit non-breaking spaces to ensure that they render.
            text = replaceMultipleSpacesWithNonBreakingSpaces(text);

            // If the text ends with a newline, render a non-breaking space at the end.
            if(text.length > 0 && text.charAt(text.length - 1) === "\n")
                text = text + "\ufeff";
            
            // If there's no text, render a non-breaking space, or a placeholder if provided.
            if(text.length === 0)
                text = placeholder ?? "\ufeff";

            // Is there a query we're supposed to highlight? If so, highlight it.
            if($context && $context.highlightedWord) {
                const query = $context.highlightedWord;
                const lowerText = text.toLowerCase();
                // Does this text contain the query? Highlight it.
                if(lowerText.indexOf(query) >= 0) {

                    // Find all the matches
                    const indices = [];
                    for(let i = 0; i < text.length; ++i) {
                        if (lowerText.substring(i, i + query.length) === query) {
                            indices.push(i);
                        }
                    }

                    // Go through each one and construct contents for the span to return.
                    segments = [];
                    for(let i = 0; i < indices.length; i++) {
                        // Push the text from the end of the last match or the start of the string.
                        segments.push([text.substring(i === 0 ? 0 : indices[i - 1] + query.length, indices[i]), false]);
                        segments.push([text.substring(indices[i], indices[i] + query.length), true]);
                    }
                    if(indices[indices.length - 1] < text.length - 1)
                        segments.push([text.substring(indices[indices.length - 1] + query.length, text.length), false]);
                }

            }
        }
    }
</script>


{#if segments }
    {#each segments as segment }
        <span class={`bookish-text ${segment[1] ? "bookish-content-highlight" : ""}`}>{segment[0]}</span>
    {/each}
{:else}
    <span class={"bookish-text"} data-nodeid={node.nodeID}>{text}</span>
{/if}