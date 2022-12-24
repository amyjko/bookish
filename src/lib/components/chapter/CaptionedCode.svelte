<script lang="ts">
    import type CodeNode from "$lib/models/chapter/CodeNode"
    import Code from './Code.svelte'
    import Python from './Python.svelte'
    import Text from './Text.svelte'
    import { getCaret, isEditable } from "../page/Contexts";
    import Figure from "./Figure.svelte";

    export let node: CodeNode;

    $: language = node.getLanguage();

    let editable = isEditable();

    // const languages = [ "C", "C++", "CSS", "Go", "HTML", "Java", "JavaScript", "Markdown", "Plaintext", "Python", "TypeScript" ];

    let caret = getCaret();
    $: inside = $caret?.range?.start.node === node.getCodeNode() || $caret?.range?.end.node === node.getCodeNode();

</script>

<Figure {node} caption={node.getCaption()}>
    {#if editable }
        {#if inside}
            <code 
                class={`bookish-code bookish-code-block language-${language}`}
            >
                <Text node={node.getCodeNode()}/>
            </code>
        {:else}
            <Code editable={false} inline={false} language={node.getLanguage()} nodeID={node.getCodeNode().nodeID}>{node.getCode()}</Code>
        {/if}
    {:else}
        {#if node.getLanguage() === "python" && node.isExecutable() }
            <Python node={node} startCode={node.getCode()}></Python>
        {:else}
            <Code editable={false} inline={false} language={node.getLanguage()} nodeID={node.getCodeNode().nodeID}>{node.getCode()}</Code>
        {/if}
    {/if}
    {#if node.getLanguage() !== "plaintext"}<div class="bookish-code-language">{node.getLanguage()}</div>{/if}
</Figure>

<style>
    .bookish-code-language {
        float: right;
        margin-top: 0;
        font-size: small;
        color: gray;
        margin-right: 0.5em;
    }
</style>