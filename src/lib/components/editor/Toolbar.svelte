<script lang="ts">
    import commands from './Commands';
    import type Command from './Command';

    import TextNode from '$lib/models/chapter/TextNode';
    import AtomNode from '$lib/models/chapter/AtomNode';

    import LinkNode from '$lib/models/chapter/LinkNode';
    import LabelNode from '$lib/models/chapter/LabelNode';
    import InlineCodeNode from '$lib/models/chapter/InlineCodeNode';
    import CitationsNode from '$lib/models/chapter/CitationsNode';
    import DefinitionNode from '$lib/models/chapter/DefinitionNode';
    import CodeNode from '$lib/models/chapter/CodeNode';
    import CalloutNode from '$lib/models/chapter/CalloutNode';
    import EmbedNode from '$lib/models/chapter/EmbedNode';
    import QuoteNode from '$lib/models/chapter/QuoteNode';
    import type MetadataNode from '$lib/models/chapter/MetadataNode';

    import LabelEditor from '$lib/components/editor/LabelEditor.svelte';
    import InlineCodeEditor from '$lib/components/editor/InlineCodeEditor.svelte';
    import CitationsEditor from '$lib/components/editor/CitationsEditor.svelte';
    import LinkEditor from '$lib/components/editor/LinkEditor.svelte';
    import DefinitionEditor from '$lib/components/editor/DefinitionEditor.svelte';
    import CaptionedCodeEditor from '$lib/components/editor/CaptionedCodeEditor.svelte';
    import CalloutEditor from '$lib/components/editor/CalloutEditor.svelte';
    import QuoteEditor from '$lib/components/editor/QuoteEditor.svelte';
    import EmbedEditor from '$lib/components/editor/EmbedEditor.svelte';
    import TableEditor from '$lib/components/editor/TableEditor.svelte';
    import ToolbarGroup from './ToolbarGroup.svelte';
    import Icon from './Icon.svelte';
    import Button from '../app/Button.svelte';

    import AnnotateIcon from './icons/annotate.svg?raw';
    import BlockIcon from './icons/block.svg?raw';
    import ClipboardIcon from './icons/clipboard.svg?raw';
    import LevelIcon from './icons/level.svg?raw';
    import ListIcon from './icons/list.svg?raw';
    import TextIcon from './icons/text.svg?raw';
    import TimeIcon from './icons/time.svg?raw';
    import TableIcon from './icons/table.svg?raw';
    import LinkIcon from './icons/link.svg?raw';

    import LabelIcon from './icons/label.svg?raw';
    import CitationIcon from './icons/citation.svg?raw';
    import DefineIcon from './icons/define.svg?raw';
    import CodeIcon from './icons/code.svg?raw';
    import CalloutIcon from './icons/callout.svg?raw';
    import QuoteIcon from './icons/quote.svg?raw';
    import MediaIcon from './icons/media.svg?raw';
    import TableNode from '../../models/chapter/TableNode';
    import { slide } from 'svelte/transition';
    import type CaretState from './CaretState';
    import Note from './Note.svelte';
    import type { CommandCategory } from './Command';

    const keyLabels: { [key: string]: string } = {
        Digit0: '0',
        Digit1: '1',
        Digit2: '2',
        Digit3: '3',
        ArrowDown: '↓',
        ArrowUp: '↑',
        ArrowLeft: '←',
        ArrowRight: '→',
        Backspace: '\u232B',
    };

    const categoryOrder: Record<CommandCategory, number> = {
        navigation: 1,
        selection: 2,
        text: 3,
        history: 4,
        clipboard: 5,
        annotation: 6,
        level: 8,
        list: 9,
        table: 10,
        block: 11,
    };

    const categoryIcons: { [key: string]: string } = {
        text: TextIcon,
        clipboard: ClipboardIcon,
        annotation: AnnotateIcon,
        level: LevelIcon,
        block: BlockIcon,
        list: ListIcon,
        table: TableIcon,
        history: TimeIcon,
    };

    export let caret: CaretState | undefined;

    $: context = caret?.context;
    $: root = context?.root;

    let element: HTMLElement | null = null;
    let categories: CommandCategory[] | undefined = undefined;
    let commandsByCategory: { [key: string]: Command[] } = {};
    let metaNode: MetadataNode<any> | AtomNode<any> | undefined = undefined;
    let calloutNode: CalloutNode | undefined = undefined;
    let quoteNode: QuoteNode | undefined = undefined;
    let embedNode: EmbedNode | undefined = undefined;
    let tableNode: TableNode | undefined = undefined;

    function getShortcutDescription(command: Command) {
        const macOS = navigator.userAgent.indexOf('Mac') >= 0;
        const controlSymbol = macOS ? '\u2318' : 'Ctrl+';
        const altSymbol = macOS ? '\u2325' : 'Alt+';
        const key = command.key
            ? Array.isArray(command.key)
                ? command.key.join('/')
                : command.key
            : command.code
              ? command.code
              : 'any';
        const keyLabel = (
            typeof key === 'string'
                ? key in keyLabels
                    ? keyLabels[key]
                    : key
                : '—'
        ).toLocaleUpperCase();
        return `${command.control ? controlSymbol : ''}${
            command.alt ? altSymbol : ''
        }${command.shift ? '\u21E7' : ''}${keyLabel}`;
    }

    // Update the above when the dependencies below change.
    $: {
        if (context !== undefined && root) {
            // Filter the commands by those interactive with a mouse and active.
            const visible = commands.filter(
                (command) =>
                    command.visible === true ||
                    (context &&
                        command.visible instanceof Function &&
                        command.visible(context)),
            );

            // Extract the active categories and sort them
            categories = Array.from(
                new Set(commands.map((command) => command.category)),
            ).sort((a, b) =>
                a in categoryOrder && b in categoryOrder
                    ? categoryOrder[a] - categoryOrder[b]
                    : 0,
            );

            // Make a list for each category of commands
            commandsByCategory = {};
            categories.forEach((cat) => {
                if (commandsByCategory)
                    commandsByCategory[cat] = visible.filter(
                        (command) => command.category === cat,
                    );
            });

            const caretNode = context.start.node;

            metaNode =
                caretNode instanceof AtomNode
                    ? caretNode
                    : caretNode instanceof TextNode
                      ? (caretNode.getParent(root) as MetadataNode<any>)
                      : undefined;

            calloutNode = caretNode.getClosestParentMatching(
                root,
                (p) => p instanceof CalloutNode,
            ) as CalloutNode;
            quoteNode = caretNode.getClosestParentMatching(
                root,
                (p) => p instanceof QuoteNode,
            ) as QuoteNode;
            embedNode =
                caretNode instanceof EmbedNode
                    ? caretNode
                    : (caretNode.getClosestParentMatching(
                          root,
                          (p) => p instanceof EmbedNode,
                      ) as EmbedNode);
            tableNode = caretNode.getClosestParentMatching(
                root,
                (p) => p instanceof TableNode,
            ) as TableNode;
        }
    }

    function handleKeyPress(event: KeyboardEvent) {
        // Return focus to the editor if someone presses an unhandled enter
        if ((event.key === 'Escape' || event.key === 'Enter') && element) {
            const editor = element.closest('.bookish-editor');
            if (editor instanceof HTMLElement) {
                event.stopPropagation();
                editor.focus();
            }
            return true;
        }
    }
</script>

<section
    class="bookish-editor-toolbar"
    bind:this={element}
    role="button"
    on:keypress={handleKeyPress}
    on:keydown={handleKeyPress}
    on:pointerdown|stopPropagation={() => element?.focus()}
    tabindex="0"
    transition:slide={{ duration: 200 }}
>
    {#if caret == undefined}
        <div class="no-selection"
            ><Note>Select rich text or images to see the toolbar.</Note></div
        >
    {:else}
        {#if context && categories}
            {#each categories as cat}
                {#if commandsByCategory[cat].length > 0}
                    {#if cat === 'annotation'}
                        <span class="break" />
                    {/if}
                    <ToolbarGroup
                        icon={cat in categoryIcons
                            ? categoryIcons[cat]
                            : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    >
                        {#each commandsByCategory[cat] as command}
                            <Button
                                disabled={command.active === false ||
                                    (command.active instanceof Function &&
                                        command.active.call(
                                            undefined,
                                            context,
                                        ) === false)}
                                tooltip={command.description +
                                    ' ' +
                                    getShortcutDescription(command)}
                                tabIndex="0"
                                command={() =>
                                    caret?.executor.call(
                                        undefined,
                                        command,
                                        '',
                                    )}
                            >
                                <Icon icon={command.icon} />
                            </Button>
                        {/each}
                        {#if cat === 'table' && tableNode}
                            <TableEditor table={tableNode} />
                        {/if}
                    </ToolbarGroup>
                {/if}
            {/each}
        {/if}
        {#if metaNode instanceof LinkNode}<ToolbarGroup icon={LinkIcon}
                ><LinkEditor link={metaNode} /></ToolbarGroup
            >
        {:else if metaNode instanceof LabelNode}<ToolbarGroup icon={LabelIcon}
                ><LabelEditor label={metaNode} /></ToolbarGroup
            >
        {:else if metaNode instanceof InlineCodeNode}<ToolbarGroup
                icon={CodeIcon}
                ><InlineCodeEditor code={metaNode} /></ToolbarGroup
            >
        {:else if metaNode instanceof CitationsNode}<ToolbarGroup
                icon={CitationIcon}
                ><CitationsEditor citations={metaNode} /></ToolbarGroup
            >
        {:else if metaNode instanceof DefinitionNode}<ToolbarGroup
                icon={DefineIcon}
                ><DefinitionEditor definition={metaNode} /></ToolbarGroup
            >
        {:else if metaNode instanceof CodeNode && context}<ToolbarGroup
                icon={CodeIcon}
                ><CaptionedCodeEditor code={metaNode} /></ToolbarGroup
            >
        {:else if calloutNode}<ToolbarGroup icon={CalloutIcon}
                ><CalloutEditor callout={calloutNode} /></ToolbarGroup
            >
        {:else if quoteNode}<ToolbarGroup icon={QuoteIcon}
                ><QuoteEditor quote={quoteNode} /></ToolbarGroup
            >
        {:else if embedNode}<ToolbarGroup icon={MediaIcon}
                ><EmbedEditor embed={embedNode} /></ToolbarGroup
            >
        {/if}
    {/if}
</section>

<style>
    .bookish-editor-toolbar {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: baseline;
        font-family: var(--app-font);
        font-size: var(--app-chrome-font-size);
        row-gap: calc(var(--app-chrome-padding) / 2);
        justify-content: left;
        /* Fixed height to prevent jumpiness */
        height: 4.5em;
        overflow-y: auto;
    }

    .break {
        flex-basis: 100%;
        height: 0;
    }

    .bookish-editor-toolbar:focus {
        outline: 2px solid var(--app-interactive-color);
        /* Expand on focus */
        min-height: 4.5em;
    }

    .no-selection {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        height: 3em;
        width: 100%;
        font-style: italic;
        font-size: var(--app-font-size);
    }
</style>
