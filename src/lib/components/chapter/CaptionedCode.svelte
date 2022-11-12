<script lang="ts">
    import type CodeNode from "$lib/models/chapter/CodeNode"
    import Code from './Code.svelte'
    import Python from './Python.svelte'
    import Format from './Format.svelte'
    import Text from './Text.svelte'
    import renderPosition from './renderPosition'
    import { isEditable } from "../page/Contexts";

    export let node: CodeNode;

    $: caption = node.getCaption();
    $: language = node.getLanguage();

    let editable = isEditable();

    // const languages = [ "C", "C++", "CSS", "Go", "HTML", "Java", "JavaScript", "Markdown", "Plaintext", "Python", "TypeScript" ];

</script>

<div class={"bookish-figure " + renderPosition(node.getPosition())} data-nodeid={node.nodeID}>
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
                {#if node.getLanguage() !== "plaintext"}<div class="bookish-code-language">{node.getLanguage()}</div>{/if}
            </div>
        {/if}
    {/if}
    {#if caption }
        <div class="bookish-figure-caption"><Format node={caption} placeholder="caption"/></div>
    {/if}
</div>