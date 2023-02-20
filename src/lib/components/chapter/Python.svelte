<script context="module" lang="ts">
    // Make Typescript happy
    type Skulpt =
        | { configure: Function; importMainWithBody: Function }
        | undefined;
    declare var Sk: Skulpt;
</script>

<script lang="ts">
    import type CodeNode from '$lib/models/chapter/CodeNode';
    import { afterUpdate, onMount } from 'svelte';
    import Code from './Code.svelte';

    export let node: CodeNode;
    export let startCode: string;

    // Start with whatever code was passed in.
    let code = startCode;

    // What is currently rendered to the console (not always program output).
    let output = '';

    // Whether the runtime is loaded. Initialized based on presence of global.
    let loaded = skulptLoaded();

    let ref: HTMLDivElement | null = null;

    onMount(() => {
        // Dynamically load the script to minimize payload and reduce index complexity.
        if (document.getElementById('skulpt') === null) {
            let script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.id = 'skulpt';
            script.onload = () => (loaded = true);
            script.src =
                'https://cdn.jsdelivr.net/combine/npm/skulpt@1.2.0/dist/skulpt.min.js,npm/skulpt@1.2.0/dist/skulpt-stdlib.min.js';
            document.getElementsByTagName('head')[0].appendChild(script);
        }
    });

    // Always scroll to the bottom of the output.
    afterUpdate(() => {
        if (ref) {
            let outputView = ref.querySelector('.bookish-python-output');
            if (outputView) outputView.scrollTop = outputView.scrollHeight;
        }
    });

    function skulptLoaded() {
        return typeof window !== 'undefined' && window.hasOwnProperty('Sk');
    }

    function reset() {
        code = startCode;
    }
    function handleEdit(newCode: string) {
        code = newCode;
    }
    function handleOutput(out: string) {
        // Update the state to re-render.
        output += out;
    }

    function start() {
        if (skulptLoaded()) {
            // Communicate that executing is starting, wait a second, then execute the program.
            // This is important in case the user wants to run it again; it provides confirmation that it was run again.
            output = 'Executing...';
            setTimeout(() => execute(), 500);
        }
    }

    function execute() {
        // Reset the output, run the code, and update it's output.
        output = '';
        if (Sk) {
            Sk.configure({ output: handleOutput });
            try {
                if (Sk) Sk.importMainWithBody('<stdin>', false, code, true);
            } catch (error) {
                handleOutput(error as string);
            }
        }
    }

    $: lines = output.split('\n');
</script>

<div class="bookish-python" bind:this={ref}>
    <Code
        inline={false}
        language={'python'}
        editable
        edited={handleEdit}
        nodeID={node.nodeID}>{code}</Code
    >
    <div class="bookish-python-controls">
        <button disabled={startCode === code} on:click={reset}
            >{'\u21BB'}</button
        >
        <button disabled={!loaded} on:click={start}>{'\u25B6\uFE0E'}</button>
        <div class="bookish-python-output">
            {#each lines as line, index}
                <span class="python-output-line"
                    >{line}{#if index < lines.length - 1}<br />{/if}</span
                >
            {/each}
        </div>
    </div>
</div>

<style>
    .bookish-python-controls {
        display: flex;
        flex-direction: row;
        align-items: stretch;
        width: 100%;
    }

    .bookish-python button {
        background: var(--bookish-block-background-color);
        border: 1px solid var(--bookish-border-color-light);
        width: 3em;
        height: 3rem;
        padding: 0;
        display: inline-block;
        vertical-align: top;
    }

    .bookish-python .bookish-python-output {
        flex: 1;
        border: 1px solid lightGray;
        padding: 0.5rem;
        height: 2rem;
        overflow-y: scroll;
        display: inline-block;
        vertical-align: top;
        color: var(--bookish-paragraph-color);
        font-family: var(--bookish-code-font-family);
        font-weight: var(--bookish-code-font-weight);
        font-size: var(--bookish-block-font-size);
    }
</style>
