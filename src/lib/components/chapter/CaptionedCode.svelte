<script lang="ts">
    import type CodeNode from '$lib/models/chapter/CodeNode';
    import Code from './Code.svelte';
    import Python from './Python.svelte';
    import Text from './Text.svelte';
    import { isEditable } from '../page/Contexts';
    import Figure from './Figure.svelte';
    import { getCaret } from '$lib/components/page/Contexts';

    export let node: CodeNode;

    $: language = node.getLanguage();

    let editable = isEditable();

    // const languages = [ "C", "C++", "CSS", "Go", "HTML", "Java", "JavaScript", "Markdown", "Plaintext", "Python", "TypeScript" ];

    let caret = getCaret();

    $: inside =
        $caret?.range?.start.node === node.getCodeNode() ||
        $caret?.range?.end.node === node.getCodeNode();
</script>

<Figure {node} caption={node.getCaption()}>
    {#if editable}
        <div class="container">
            <code
                class={`bookish-code bookish-code-block language-${language} ${
                    !inside ? 'hidden' : ''
                }`}
            >
                <Text node={node.getCodeNode()} />
            </code>
            <div class="code" class:inside>
                <Code
                    editable={false}
                    inline={false}
                    language={node.getLanguage()}
                    nodeID={node.getCodeNode().nodeID}>{node.getCode()}</Code
                >
            </div>
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
    {#if node.getLanguage() !== 'plaintext'}<div class="bookish-code-language"
            >{node.getLanguage()}</div
        >{/if}
</Figure>

<style>
    .bookish-code-language {
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
    .code {
        position: absolute;
        top: 0;
        width: 100%;
    }
    .code.inside {
        display: none;
    }
</style>
