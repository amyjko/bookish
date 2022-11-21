<script lang="ts">
    import type CodeNode from "$lib/models/chapter/CodeNode"
    import Code from './Code.svelte'
    import Python from './Python.svelte'
    import Text from './Text.svelte'
    import { isEditable } from "../page/Contexts";
    import Figure from "./Figure.svelte";

    export let node: CodeNode;

    $: language = node.getLanguage();

    let editable = isEditable();

    // const languages = [ "C", "C++", "CSS", "Go", "HTML", "Java", "JavaScript", "Markdown", "Plaintext", "Python", "TypeScript" ];

</script>

<Figure {node} caption={node.getCaption()}>
    {#if editable }
        <code 
            class={`bookish-code bookish-code-block language-${language}`}
        >
            <Text node={node.getCodeNode()}/>
        </code>
    {:else}
        {#if node.getLanguage() === "python" && node.isExecutable() }
            <Python node={node} startCode={node.getCode()}></Python>
        {:else}
            <div>
                <Code editable={false} inline={false} language={node.getLanguage()} nodeID={node.getCodeNode().nodeID}>{node.getCode()}</Code>
            </div>
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