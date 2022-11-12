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
    let lang = language ? (hljs.getLanguage(language) === undefined ? "text" : language) : "plaintext";

</script>

<code 
    data-nodeid={nodeID}
    contenteditable={editable}
    class={`bookish-code ${inline ? "bookish-code-inline" : "bookish-code-block"} ${"language-" + lang}`} 
    on:blur={handleChange}
    bind:this={el}>
        <slot></slot>
</code>