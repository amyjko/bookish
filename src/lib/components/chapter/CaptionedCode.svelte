<svelte:options immutable={true} />

<script lang="ts">
    import type CodeNode from '$lib/models/chapter/CodeNode';
    import Code from './Code.svelte';
    import Python from './Python.svelte';
    import Text from './Text.svelte';
    import { isChapterEditable } from '../page/Contexts';
    import Figure from './Figure.svelte';
    import Button from '../app/Button.svelte';

    export let node: CodeNode;

    $: language = node.getLanguage();

    let editable = isChapterEditable();

    // const languages = [ "C", "C++", "CSS", "Go", "HTML", "Java", "JavaScript", "Markdown", "Plaintext", "Python", "TypeScript" ];

    let editing = true;
</script>

<Figure {node} caption={node.getCaption()} focusable={false}>
    {#if editable && editing}
        <div class="container" class:editing>
            <code
                class={`bookish-code bookish-code-block language-${language}`}
            >
                <Text node={node.getCodeNode()} />
            </code>
        </div>
    {:else if node.getLanguage() === 'python' && node.isExecutable()}
        <Python {node} startCode={node.getCode()} />
    {:else}
        <Code
            editable={false}
            inline={false}
            language={node.getLanguage()}
            nodeID={node.getCodeNode().nodeID}>{node.getCode()}</Code
        >
    {/if}
    {#if editable}
        <Button
            tooltip={editing ? 'stop editing' : 'start editing'}
            command={() => {
                editing = !editing;
            }}
            >{#if editing}done{:else}edit{/if}</Button
        >
    {/if}
    {#if node.getLanguage() !== 'plaintext'}<aside class="language"
            >{node.getLanguage()}</aside
        >{/if}
</Figure>

<style>
    .language {
        float: right;
        margin-top: 0;
        font-size: small;
        color: gray;
        margin-right: 0.5em;
    }

    .bookish-code.hidden {
        opacity: 0;
    }

    .container {
        position: relative;
    }

    .container.editing {
        border: 1px solid var(--app-interactive-color);
        border-radius: var(--app-chrome-roundedness);
    }

    .code {
        position: absolute;
        top: 0;
        width: 100%;
    }
    .code.inside {
        display: none;
    }
</style>
