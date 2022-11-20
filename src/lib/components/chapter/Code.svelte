<script lang="ts">
    import hljs from 'highlight.js';
    import { onMount } from 'svelte';

    // Suppress unescaped HTML warning, trusting the escaping of the parser.
    hljs.configure({ ignoreUnescapedHTML: true });

    export let editable: boolean;
    export let inline: boolean;
    export let nodeID: number | undefined;
    export let edited: ((text: string) => void) | undefined = undefined;
    export let language: string | undefined = undefined;

    let el: HTMLElement | null = null;

    // Find any code tags inside and highlight them.
    function highlightCode() {
        if(el)
            hljs.highlightElement(el);
    }
    
    // When the component mounts or updates, highlight the code inside.
    onMount(() => {
        highlightCode();
    });

    function handleChange() {
        if(el && edited)
            edited(el.innerText);
    }

    // There's no way to mute highlightjs warnings on missing languages, so we check here.
    $: lang = language ? (hljs.getLanguage(language) === undefined ? "text" : language) : "plaintext";

</script>

<code 
    data-nodeid={nodeID}
    contenteditable={editable}
    class={`bookish-code ${inline ? "bookish-code-inline" : "bookish-code-block"} ${"language-" + lang}`} 
    on:blur={handleChange}
    bind:this={el}>
        <slot></slot>
</code>

<style>
    .bookish-code {
        font-family: var(--bookish-code-font-family);
        font-weight: var(--bookish-code-font-weight);
        font-size: var(--bookish-code-font-size);
        white-space: pre-wrap;	
        border: 1px solid var(--bookish-border-color-light);
        color: var(--bookish-muted-color);
        background-color: var(--bookish-block-background-color);
        clear: both;
    }

    code {
        font-family: var(--bookish-code-font-family);
        font-weight: var(--bookish-code-font-weight);
        font-size: var(--bookish-code-font-size);	
    }

    .bookish-code-block {
        display: block;
        padding: var(--bookish-block-padding);
        line-height: var(--bookish-paragraph-line-height-tight);
        border-radius: var(--bookish-roundedness);
    }

    .bookish-code-inline {
        display: inline;
        padding: calc(1.5 * var(--bookish-inline-padding)) var(--bookish-inline-padding);
    }

    .bookish-code-inline :global(code) {
        display: inline;	
        padding: 0em;
    }

    .bookish-code-language {
        float: right;
        margin-top: -3em;
        font-size: small;
        color: gray;
        margin-right: 0.5em;
    }

    /* Default color */
    .hljs,
    .hljs-title,
    .hljs-params,
    .hljs-section {
        color: var(--bookish-paragraph-color);
    }

    /* Comment */
    .hljs-comment,
    .hljs-quote {
        color: var(--bookish-comment-color);
    }

    .hljs-variable,
    .hljs-template-variable,
    .hljs-tag,
    .hljs-name,
    .hljs-selector-id,
    .hljs-selector-class,
    .hljs-regexp,
    .hljs-deletion {
        color: var(--bookish-error-color);
    }

    .hljs-number,
    .hljs-built_in,
    .hljs-builtin-name,
    .hljs-literal,
    .hljs-string,
    .hljs-symbol,
    .hljs-meta,
    .hljs-addition {
        color: var(--bookish-link-color);
    }

    .hljs-type,
    .hljs-attribute,
    .hljs-keyword,
    .hljs-selector-tag {
    color: var(--bookish-highlight-color);
    }

    .hljs-emphasis {
    font-style: italic;
    }

    .hljs-strong {
    font-weight: bold;
    }

</style>