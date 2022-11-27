<script lang="ts">
    import commands from "./Commands";
    import type Command from "./Command";
    import type CaretState from "./CaretState";

    import TextNode from "$lib/models/chapter/TextNode";
    import AtomNode from "$lib/models/chapter/AtomNode";

    import LinkNode from "$lib/models/chapter/LinkNode";
    import LabelNode from "$lib/models/chapter/LabelNode";
    import InlineCodeNode from "$lib/models/chapter/InlineCodeNode";
    import CitationsNode from "$lib/models/chapter/CitationsNode";
    import DefinitionNode from "$lib/models/chapter/DefinitionNode";
    import CodeNode from "$lib/models/chapter/CodeNode";
    import CalloutNode from "$lib/models/chapter/CalloutNode";
    import EmbedNode from "$lib/models/chapter/EmbedNode";
    import QuoteNode from "$lib/models/chapter/QuoteNode";
    import type MetadataNode from "$lib/models/chapter/MetadataNode";
    
    import LabelEditor from "$lib/components/editor/LabelEditor.svelte";
    import InlineCodeEditor from "$lib/components/editor/InlineCodeEditor.svelte";
    import CitationsEditor from "$lib/components/editor/CitationsEditor.svelte";
    import LinkEditor from "$lib/components/editor/LinkEditor.svelte";
    import DefinitionEditor from "$lib/components/editor/DefinitionEditor.svelte";
    import CaptionedCodeEditor from "$lib/components/editor/CaptionedCodeEditor.svelte";
    import CalloutEditor from "$lib/components/editor/CalloutEditor.svelte";
    import QuoteEditor from "$lib/components/editor/QuoteEditor.svelte";
    import EmbedEditor from "$lib/components/editor/EmbedEditor.svelte";
    import ToolbarGroup from "./ToolbarGroup.svelte";
    import ToolbarIcon from "./ToolbarIcon.svelte";
    import { onMount } from "svelte";
    import Button from "../app/Button.svelte";

    const keyLabels: {[key: string]: string} = {
        "Digit0": "0",
        "Digit1": "1",
        "Digit2": "2",
        "Digit3": "3",
        "ArrowDown": "↓",
        "ArrowUp": "↑",
        "ArrowLeft": "←",
        "ArrowRight": "→",
        "Backspace": "\u232B",
    }

    const categoryOrder: {[key:string] : number } = {
        "navigation": 1,
        "selection": 2,
        "text": 3,
        "clipboard": 4, 
        "annotation": 5,
        "paragraph": 6,
        "level": 7,
        "list": 8,
        "table": 9,
        "block": 10,
    }

    const categoryIcons: {[key:string]: string} = {
        "text": "text.svg",
        "clipboard": "scissors.svg",
        "annotation": "hash.svg",
        "level": "level.svg",
        "block": "block.svg",
        "list": "list.svg",
        "table": "▦",
        "history": "\u2026"
    }

    export let context: CaretState | undefined = undefined;
    export let executor: ((command: Command, key: string) => void) | undefined = undefined;
    export let visible: boolean = false;

    $: chapter = context?.root;

    let element: HTMLElement | null = null;
    let categories: string[] | undefined = undefined;
    let commandsByCategory: {[key: string]: Command[]} = {};
    let metaNode: MetadataNode<any> | AtomNode<any> | undefined = undefined;
    let calloutNode: CalloutNode | undefined = undefined;
    let quoteNode: QuoteNode | undefined = undefined;
    let embedNode: EmbedNode | undefined = undefined;
    $: isVisible = visible || containsFocus();

    // Listen to focus changes to decide whether the toolbar is visible.
    onMount(() => {
        window.addEventListener("focus", updateVisible);
        window.addEventListener("blur", updateVisible);

        return () => {
            window.removeEventListener("focus", updateVisible);
            window.removeEventListener("blur", updateVisible);
        }
    });

    function containsFocus() { return element !== null && element.contains(document.activeElement); }
    function updateVisible() {
        isVisible = visible || containsFocus();
    }

    function getShortcutDescription(command: Command) {
        const macOS = navigator.platform.indexOf('Mac') > -1;
        const controlSymbol = macOS ? "\u2318" : "Ctrl+";
        const altSymbol = macOS ? "\u2325" : "Alt+";
        const key = command.key ? (Array.isArray(command.key) ? command.key.join("/") : command.key) : command.code ? command.code : "any";
        const keyLabel = (key in keyLabels ? keyLabels[key] : key).toLocaleUpperCase();
        return `${command.control ? controlSymbol : ""}${command.alt ? altSymbol : ""}${command.shift ? "\u21E7" : ""}${keyLabel}`;
    }

    // Update the above when the dependencies below change.
    $: {

        if(context !== undefined && chapter) {

            // Filter the commands by those interactive with a mouse and active.
            const visible = commands.filter(command => command.visible === true || (context && command.visible instanceof Function && command.visible(context)));

            // Extract the active categories and sort them
            categories = 
                Array.from(new Set(commands.map(command => command.category)))
                    .sort((a, b) => a in categoryOrder && b in categoryOrder ? categoryOrder[a] - categoryOrder[b] : 0);

            // Make a list for each category of commands
            commandsByCategory = {};
            categories.forEach(cat => {
                if(commandsByCategory)
                    commandsByCategory[cat] = visible.filter(command => command.category === cat);
            });

            const caretNode = context.start.node;

            metaNode = 
                caretNode instanceof AtomNode ? caretNode :
                caretNode instanceof TextNode ? caretNode.getParent(chapter) as MetadataNode<any> : 
                undefined;

            calloutNode = caretNode.getClosestParentMatching(chapter, p => p instanceof CalloutNode) as CalloutNode;
            quoteNode = caretNode.getClosestParentMatching(chapter, p => p instanceof QuoteNode) as QuoteNode;
            embedNode = caretNode.getClosestParentMatching(chapter, p => p instanceof EmbedNode) as EmbedNode;

        }
    }

    function handleKeyPress(event: KeyboardEvent) {
        // Return focus to the editor if someone presses an unhandled enter
        if(event.key === "Enter" && element) {
            const editor = element.closest(".bookish-editor");
            if(editor instanceof HTMLElement) {
                event.stopPropagation();
                editor.focus();
            }
            return true;
        }
    }

</script>

{#if chapter}
    <section 
        class="bookish-editor-toolbar" 
        on:keypress={handleKeyPress} 
        style={`margin: ${isVisible ? "0px" : "-20em"};`} 
        bind:this={element}
        on:mousedown|stopPropagation={ () => element?.focus() }
        tabIndex=0
    >
        {#if context && categories && executor}
            {#each categories as cat }
                {#if commandsByCategory[cat].length > 0 }
                    <ToolbarGroup linebreak={false} icon={ cat in categoryIcons ? categoryIcons[cat] : cat.charAt(0).toUpperCase() + cat.slice(1) }>
                        {#each commandsByCategory[cat] as command }
                            <Button 
                                disabled={command.active === false || (command.active instanceof Function && command.active.call(undefined, context) === false)}
                                tooltip={command.description + " " + getShortcutDescription(command)}
                                tabIndex=0
                                command={() => executor?.call(undefined, command, "")}
                            >
                                {#if command.icon }
                                    <ToolbarIcon name={command.icon}/>
                                {:else if command.label }
                                    {command.label}
                                {:else}
                                    {command.description }
                                {/if}
                            </Button>
                        {/each}
                    </ToolbarGroup>
                {/if}
            {/each}
        {/if}
        {#if metaNode instanceof LinkNode}<ToolbarGroup icon="link.svg"><LinkEditor link={metaNode}/></ToolbarGroup>
        {:else if metaNode instanceof LabelNode}<ToolbarGroup icon="•"><LabelEditor label={metaNode}/></ToolbarGroup>
        {:else if metaNode instanceof InlineCodeNode}<ToolbarGroup icon="code.svg"><InlineCodeEditor code={metaNode}/></ToolbarGroup>
        {:else if metaNode instanceof CitationsNode}<ToolbarGroup icon="¹"><CitationsEditor citations={metaNode}/></ToolbarGroup>
        {:else if metaNode instanceof DefinitionNode}<ToolbarGroup icon="Aa"><DefinitionEditor definition={metaNode}/></ToolbarGroup>
        {:else if metaNode instanceof CodeNode && context}<ToolbarGroup icon="code.svg"><CaptionedCodeEditor code={metaNode}/></ToolbarGroup>
        {:else if calloutNode}<ToolbarGroup icon="🄰"><CalloutEditor callout={calloutNode} /></ToolbarGroup>
        {:else if quoteNode}<ToolbarGroup icon="quote.svg"><QuoteEditor quote={quoteNode} /></ToolbarGroup>
        {:else if embedNode}<ToolbarGroup linebreak icon="media.svg"><EmbedEditor embed={embedNode} /></ToolbarGroup>
        {/if}
    </section>
{/if}

<style>
    .bookish-editor-toolbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: var(--bookish-background-color);
        border: var(--app-chrome-border-size) solid var(--app-border-color);
        font-family: var(--app-font);
        font-size: var(--app-chrome-font-size);
        z-index: 2;
        transition: top 1s;
    }

</style>