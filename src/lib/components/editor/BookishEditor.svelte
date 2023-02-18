<script lang="ts">
    import BookishNode from '$lib/models/chapter/Node';
    import ChapterNode from '$lib/models/chapter/ChapterNode';
    import LinkNode from '$lib/models/chapter/LinkNode';
    import ParagraphNode from '$lib/models/chapter/ParagraphNode';
    import TextNode from '$lib/models/chapter/TextNode';
    import AtomNode from '$lib/models/chapter/AtomNode';
    import FormatNode from '$lib/models/chapter/FormatNode';
    import BlocksNode from '$lib/models/chapter/BlocksNode';
    import ListNode from '$lib/models/chapter/ListNode';
    import TableNode from '$lib/models/chapter/TableNode';
    import MetadataNode from '$lib/models/chapter/MetadataNode';
    import type RootNode from '$lib/models/chapter/RootNode';
    import type Edit from '$lib/models/chapter/Edit';
    import CodeNode from '$lib/models/chapter/CodeNode';
    import BlockNode from '$lib/models/chapter/BlockNode';
    import EmbedNode from '$lib/models/chapter/EmbedNode';
    import ErrorNode from '$lib/models/chapter/ErrorNode';

    import type Caret from '$lib/models/chapter/Caret';
    import type { CaretRange } from '$lib/models/chapter/Caret';
    import {
        caretRangeToIndexRange,
        indexRangeToCaretRange,
    } from '$lib/models/chapter/Caret';
    import type WhatsAroundTheCaret from './CaretContext';

    import type Command from './Command';
    import type Clipboard from './Clipboard';
    import type UndoState from './UndoState';
    import type CaretUtilities from './CaretUtilities';

    import commands from './Commands';

    import { afterUpdate, onMount, setContext } from 'svelte';
    import type { PasteContent } from './CaretContext';
    import { getCaret, getRoot } from '../page/Contexts';
    import CaretView from './CaretView.svelte';
    import { writable } from 'svelte/store';

    const IDLE_TIME = 500;

    export let text: string;
    export let parser: (text: string) => RootNode;
    export let save: (node: RootNode) => Promise<void> | void;
    export let chapter: boolean;
    export let autofocus: boolean = false;
    export let component: ConstructorOfATypedSvelteComponent;
    export let placeholder: string;
    export let leasee: string | boolean;
    export let lease: (lock: boolean) => Promise<boolean> | boolean;

    let element: HTMLDivElement | null = null;

    let caretRange: CaretRange | undefined = undefined;
    let caretCoordinate: { x: number; y: number; height: number } | undefined =
        undefined;
    let lastInputTime = 0;
    let keyboardIdle = true;
    let editorFocused = false;
    let undoStack: UndoState[] = [];
    let undoPosition = -1;
    let clipboard: Clipboard | undefined = undefined;
    let ignoredInput = false;

    let activeEditor = getCaret();

    let editedNode: RootNode;
    $: {
        // Note: when the text changes externally, the caret will be lost. We either have
        // to implement fancy operational transform revision control for collaborative editing
        // or a basic chapter locking strategy to avoid data loss. I went with locking for maintenance simplicity,
        // but it would be nice to implement operational transform in the future.
        if (editedNode === undefined || editedNode.toBookdown() !== text) {
            editedNode = parser(text);
        }
    }

    $: locked = typeof leasee === 'string';

    onMount(() => {
        const caret = editedNode.getFirstCaret();
        if (caret) caretRange = { start: caret, end: caret };

        // Focus the editor on load.
        if (element && autofocus === true) {
            element.focus();
        }

        // Listen to selection changes
        document.addEventListener('selectionchange', handleSelectionChange);

        // Stop listening to selection changes
        return () => {
            document.removeEventListener(
                'selectionchange',
                handleSelectionChange
            );
        };
    });

    onMount(() => {
        // When input happens, set a timer and then see if idle time has elapsed. If it has, track time since last keystroke to control caret blinking behavior.
        const keystrokeTimer = setInterval(() => {
            // Remember that we're idle so we can render things accordingly.
            const isIdle = Date.now() - lastInputTime > IDLE_TIME;
            if (isIdle) {
                keyboardIdle = true;
                ignoredInput = false;
            }
        }, IDLE_TIME);
        return () => {
            // Clear the timer if we're unmounting or re-rendering.
            clearTimeout(keystrokeTimer);
        };
    });

    // When the selection changes and is rendered, set the browser's selection to correspond. This helps with two things:
    // 1) we can rely on the browser to render selections rather than rendering it ourselves.
    // 2) We can measure the caret position, so we can render our own fancy one rather than relying on inconsistent cross browser behavior.
    afterUpdate(() => {
        if (!editorFocused) return;

        // Measure the location of the selection using the browser's selection.
        let docSelection = document.getSelection();
        let newCaretPosition = undefined;
        if (docSelection) {
            if (caretRange) {
                // Browsers don't render backwards ranges, so we sort this before measuring.
                const sortedRange = caretRange;
                let startNode = document.querySelector(
                    `[data-nodeid='${sortedRange.start.node.nodeID}`
                );
                let endNode = document.querySelector(
                    `[data-nodeid='${sortedRange.end.node.nodeID}`
                );

                // If we found both selected nodes and we have a reference to the DOM, update the
                // browser's selection if necessary and measure it's position so we can draw our own caret.
                if (startNode && endNode && element) {
                    // If the current selection isn't different from the new one, then we don't do any of this.
                    // This prevents an infinite loop when, for example, the user clicks, the browser selection changes,
                    // and we update the caret range, which updates the browser selection, ad infinitum.
                    let rangeChanged = true;
                    let currentRange = undefined;
                    if (docSelection.rangeCount > 0) {
                        currentRange = docSelection.getRangeAt(0);
                        // If our caret range is non-empty TextNodes at a particular index and equal to the browser's caret range, then nothing's changed, so we shouldn't update the selection.
                        const startIsEqual =
                            startNode.childNodes.length > 0 &&
                            currentRange.startContainer ===
                                startNode.childNodes[0] &&
                            currentRange.startOffset ===
                                sortedRange.start.index;
                        const endIsEqual =
                            endNode.childNodes.length > 0 &&
                            currentRange.endContainer ===
                                endNode.childNodes[0] &&
                            currentRange.endOffset === sortedRange.end.index;
                        if (startIsEqual && endIsEqual) rangeChanged = false;
                    }

                    // We always aim for the DOM text nodes inside of bookish-text, but when the text nodes are the empty string, React doesn't
                    // render a DOM text node, and browsers often render an empty bounding box in this case. To measure the caret position,
                    // we insert a zero-width space in the empty span, then remove it after measurement.
                    // We only do this to the end node if it's different from the start node.
                    // We leave them in there so that the "rangeChanged" guard below can track them.
                    const emptyStart = startNode.childNodes.length === 0;
                    const emptyEnd =
                        startNode !== endNode &&
                        endNode.childNodes.length === 0;
                    if (emptyStart)
                        startNode.appendChild(
                            document.createTextNode('\ufeff')
                        );
                    if (emptyEnd)
                        endNode.appendChild(document.createTextNode('\ufeff'));

                    // If we're just after a new line, set the selection to the character after.
                    const afterNewLine =
                        sortedRange.start.node instanceof TextNode &&
                        sortedRange.start.index > 0 &&
                        sortedRange.start.node
                            .getText()
                            .charAt(sortedRange.start.index - 1) === '\n';

                    // If the range has changed, set the selection so we can measure it's location.
                    // We guard this to avoid triggering unnecessary selection change events that don't actually modify the selection.
                    if (rangeChanged) {
                        try {
                            docSelection.setBaseAndExtent(
                                startNode.childNodes[0],
                                sortedRange.start.index,
                                endNode.childNodes[0],
                                sortedRange.end.index
                            );
                        } catch (e) {
                            console.error(e);
                            console.error(
                                `Error setting caret range, trying to set to ${startNode.childNodes[0]}:${sortedRange.start.index} - ${endNode.childNodes[0]}:${sortedRange.end.index}`
                            );
                        }
                        currentRange = docSelection.getRangeAt(0);
                    }

                    // Measure and remember caret position
                    if (currentRange) {
                        const rangeRect = currentRange.getBoundingClientRect();
                        const textRect = startNode.getBoundingClientRect();
                        const lineHeightString = window
                            .getComputedStyle(startNode)
                            .getPropertyValue('line-height');
                        const lineHeight = lineHeightString.endsWith('px')
                            ? parseInt(
                                  lineHeightString.substring(
                                      0,
                                      lineHeightString.length - 2
                                  )
                              )
                            : undefined;

                        // Is the caret in relatively positioned ancestors above the editor? Undo their offsets.
                        let caretAncestor: HTMLElement | null =
                            startNode.closest('.bookish-editor');
                        let relativeX = 0;
                        let relativeY = 0;
                        while (caretAncestor != null) {
                            if (
                                window.getComputedStyle(caretAncestor)
                                    .position === 'relative'
                            ) {
                                relativeX += caretAncestor.offsetLeft;
                                relativeY += caretAncestor.offsetTop;
                            }
                            caretAncestor = caretAncestor.parentElement;
                        }

                        // If we're after a new line, calculate the correct position, since selections don't actually render to the next line.
                        const left = afterNewLine
                            ? textRect.left
                            : rangeRect.left;
                        const top =
                            afterNewLine && lineHeight
                                ? rangeRect.top + lineHeight
                                : rangeRect.top;
                        const position = {
                            x: left + window.scrollX - relativeX,
                            y: top + window.scrollY - relativeY,
                            height: rangeRect.height,
                        };
                        newCaretPosition = position;
                    }
                }
            }
            // If the range is empty, remove the browser's selection too.
            else if (editorFocused) document.getSelection()?.empty();
        }

        // Save the new caret position so we render it.
        caretCoordinate = newCaretPosition;
    });

    function rangeToCaret(domNode: Node, rangeIndex: number) {
        // If it's a text node, find the closest TextNode parent
        if (domNode.nodeType === Node.TEXT_NODE) {
            let parent = domNode.parentNode;
            // Keep looking up until we find the TextNode span with the node ID.
            while (
                parent &&
                !(
                    parent instanceof HTMLElement &&
                    parent.classList.contains('bookish-text')
                )
            )
                parent = parent.parentNode;
            if (parent && parent.dataset.nodeid) {
                const node = editedNode.getNode(
                    parseInt(parent.dataset.nodeid)
                );
                if (node instanceof TextNode)
                    // Account for the zero-width spaces that we insert in order to make selections possible on empty text nodes.
                    return {
                        node: node,
                        index: Math.min(rangeIndex, node.getLength()),
                    };
            }
        }
        // If it's an element, see if it has a nodeID and handle it accordingly.
        else if (
            domNode.nodeType === Node.ELEMENT_NODE &&
            domNode instanceof HTMLElement &&
            domNode.dataset.nodeid
        ) {
            const node = editedNode.getNode(parseInt(domNode.dataset.nodeid));
            // These assume that triple clicks on paragraphs in the browser choose text nodes for the selection start
            // and spans or paragraph nodes for the end.
            if (node instanceof ParagraphNode) {
                const first = node.getFirstTextNode();
                return { node: first, index: 0 };
            } else if (node instanceof TextNode) {
                return { node: node, index: 0 };
            }
        }

        // Return nothing by default.
        return undefined;
    }

    function handleSelectionChange() {
        // Make sure we're showing the caret.
        lastInputTime = Date.now();
        keyboardIdle = false;

        // Map the browser selection to our caret range model.
        const selection = document.getSelection();

        if (selection && selection.anchorNode && selection.focusNode) {
            const start = rangeToCaret(
                selection.anchorNode,
                selection.anchorOffset
            );
            const end = rangeToCaret(
                selection.focusNode,
                selection.focusOffset
            );
            // If we found to text nodes, set the selection
            if (start && end) {
                caretRange = { start: start, end: end };
            }
        }
    }

    function getCaretCoordinate(
        caret: Caret
    ): { top: number; left: number; height: number } | undefined {
        if (!(caret.node instanceof TextNode || caret.node instanceof AtomNode))
            return undefined;
        const domNode = document.querySelector(
            `[data-nodeid='${caret.node.nodeID}`
        );
        // If we didn't find the node or there's no text node inside it, then there's no caret position.
        // This happens temporarily before the useEffect above has a chance to insert zero-width non-breaking space.
        if (domNode === null || domNode.childNodes.length === 0)
            return undefined;
        const range = document.createRange();
        range.setStart(
            domNode.childNodes.length === 0 ? domNode : domNode.childNodes[0],
            domNode.childNodes.length === 0 ? 0 : caret.index
        );
        const characterRect = range.getBoundingClientRect();
        if (characterRect.left > 0)
            return {
                top: characterRect.top,
                left: characterRect.left,
                height: characterRect.height,
            };
        const elementRect = domNode.getBoundingClientRect();
        return {
            top: elementRect.top,
            left: elementRect.left,
            height: elementRect.height,
        };
    }

    function getCaretOnLine(caret: Caret, below: boolean): Caret {
        if (caret.node instanceof TextNode || caret.node instanceof AtomNode) {
            // Find the position of the current start node.
            const startCoordinate = getCaretCoordinate(caret);
            let candidate = editedNode.getAdjacentCaret(caret, below);
            if (candidate === undefined) return caret;
            let previousCandidate = undefined;
            let previousCoordinate = undefined;
            if (startCoordinate) {
                while (
                    candidate.node instanceof TextNode ||
                    candidate.node instanceof AtomNode
                ) {
                    const candidateCoordinate = getCaretCoordinate(candidate);
                    // Did we make it to the next line and the character before/after? If we're going down,
                    // we're looking for a top that's below the bottom. If we're going up, we're looking for a bottom
                    // that's below the top.
                    if (candidateCoordinate) {
                        const startTop = startCoordinate.top;
                        const candidateTop = candidateCoordinate.top;
                        const closerCandidate =
                            previousCoordinate &&
                            previousCandidate &&
                            Math.abs(
                                startCoordinate.left - previousCoordinate.left
                            ) <
                                Math.abs(
                                    startCoordinate.left -
                                        candidateCoordinate.left
                                )
                                ? previousCandidate
                                : candidate;
                        if (below) {
                            // If this candidate is on the line below the start line, then return the last candidate on the line below the start line.
                            if (
                                previousCandidate &&
                                previousCoordinate &&
                                previousCoordinate.top >
                                    startTop + startCoordinate.height &&
                                candidateTop >
                                    previousCoordinate.top +
                                        previousCoordinate.height
                            )
                                return previousCandidate;
                            // If this is just below the start position, stop and return the closer of the current and previous candidates.
                            else if (
                                candidateTop >
                                    startTop + startCoordinate.height &&
                                candidateCoordinate.left >= startCoordinate.left
                            )
                                return closerCandidate;
                        } else {
                            // If this candidate is on the live above the line above the start line, then return the last candidate on the line above the start line.
                            if (
                                previousCandidate &&
                                previousCoordinate &&
                                previousCoordinate.top +
                                    previousCoordinate.height <
                                    startTop &&
                                candidateTop + candidateCoordinate.height <
                                    previousCoordinate.top
                            )
                                return previousCandidate;
                            // If this is just above the start position, stop and return the closer of the current and previous candidates.
                            if (
                                candidateTop + candidateCoordinate.height <
                                    startTop &&
                                candidateCoordinate.left <= startCoordinate.left
                            )
                                return closerCandidate;
                        }
                    }

                    // Get the next candidate to consider.
                    const nextCandidate: Caret | undefined =
                        editedNode.getAdjacentCaret(candidate, below);
                    if (nextCandidate === undefined) break;

                    // If the caret didn't move, we stop searching, something is wrong.
                    if (
                        nextCandidate.node === candidate.node &&
                        nextCandidate.index === candidate.index
                    ) {
                        break;
                    }

                    // Otherwise, we advance to the next candidate.
                    previousCandidate = candidate;
                    previousCoordinate = candidateCoordinate;
                    candidate = nextCandidate;

                    if (candidate === undefined) return caret;
                }
                return candidate;
            }
        }

        // If we didn't find one, just return what we were given.
        return caret;
    }

    function atParagraphStart(): boolean {
        if (
            caretRange === undefined ||
            caretRange.start.node !== caretRange.end.node ||
            caretRange.start.index !== caretRange.end.index ||
            !(caretRange.start.node instanceof TextNode)
        )
            return false;

        const firstCaret = caretRange.start.node
            .getFormatRoot(editedNode)
            ?.getFirstCaret();
        return (
            firstCaret !== undefined &&
            firstCaret.node === caretRange.start.node &&
            firstCaret.index === caretRange.start.index
        );
    }

    function undo(): Edit {
        // Grab the next state
        let undoState = undoStack[undoPosition + 1];

        // Restore the content of the chapter.
        let node = parser(undoState.bookdown);

        if (node === undefined || node instanceof ErrorNode) return;

        // Restore the view
        updateRoot(node);

        // Save the undo.
        save(node);

        // Move the undo state down a position.
        if (undoPosition < undoStack.length) undoPosition = undoPosition + 1;

        // Return the original caret.
        const range = indexRangeToCaretRange(node, undoState.range);
        if (range === undefined) return;
        return { root: node, range: range };
    }

    function redo(): Edit {
        // Grab the next state
        let undoState = undoStack[undoPosition - 1];

        // Restore the content of the chapter.
        let node = parser(undoState.bookdown);

        if (node === undefined) return;

        updateRoot(node);

        // Move the undo state down a position.
        if (undoPosition > 0) undoPosition = undoPosition - 1;

        // Return the original caret.
        const range = indexRangeToCaretRange(node, undoState.range);
        if (range === undefined) return;
        return { root: node, range: range };
    }

    function getCaretContext(): WhatsAroundTheCaret | undefined {
        if (caretRange === undefined) return undefined;

        // Determine whether the range contains a list
        const nodes = editedNode.getNodes();
        let inside = false;
        let includesList = false;
        nodes.forEach((n) => {
            if (caretRange === undefined) return;
            if (n === caretRange.start.node) inside = true;
            if (
                inside &&
                n.getClosestParentMatching(
                    editedNode,
                    (p) => p instanceof ListNode
                ) !== undefined
            )
                includesList = true;
            if (n === caretRange.end.node) inside = false;
        });

        const parents = editedNode
            .getParentsOf(caretRange.start.node)
            ?.reverse() as BookishNode[];

        return {
            // We make a new range so that setCaretRange always causes a re-render
            chapter: chapter,
            range: { start: caretRange.start, end: caretRange.end },
            start: caretRange.start,
            end: caretRange.end,
            isSelection:
                caretRange.start.node !== caretRange.end.node ||
                caretRange.start.index !== caretRange.end.index,
            root: editedNode,
            blocks: parents?.find((n) => n instanceof BlocksNode) as BlocksNode,
            paragraph: parents?.find(
                (n) => n instanceof ParagraphNode
            ) as ParagraphNode,
            block: parents?.find((n) => n instanceof BlockNode) as BlockNode,
            code: parents?.find((n) => n instanceof CodeNode) as CodeNode,
            list: parents?.find((n) => n instanceof ListNode) as ListNode,
            atom: parents?.find((n) => n instanceof AtomNode) as AtomNode<any>,
            meta: parents?.find(
                (n) => n instanceof MetadataNode
            ) as MetadataNode<FormatNode>,
            includesList: includesList,
            table: parents?.find((n) => n instanceof TableNode) as TableNode,
            format:
                caretRange.end.node instanceof TextNode ||
                caretRange.end.node instanceof AtomNode
                    ? caretRange.end.node.getFormatRoot(editedNode)
                    : undefined,
            startIsText: caretRange.start.node instanceof TextNode,
            endIsText: caretRange.end.node instanceof TextNode,
            startIsTextOrAtom:
                caretRange.start.node instanceof TextNode ||
                caretRange.start.node instanceof AtomNode ||
                caretRange.start.node instanceof EmbedNode,
            endIsTextOrAtom:
                caretRange.end.node instanceof TextNode ||
                caretRange.end.node instanceof AtomNode ||
                caretRange.start.node instanceof EmbedNode,
            atParagraphStart: atParagraphStart(),
            undoStack: undoStack,
            undoPosition: undoPosition,
            undo: undo,
            redo: redo,
            clipboard: clipboard,
            handleCopy: handleCopy,
            handlePaste: handlePaste,
        };
    }

    function getUtilities(): CaretUtilities {
        return {
            getCaretOnLine: getCaretOnLine,
        };
    }

    function handlePress(event: KeyboardEvent) {
        handleKey(event, true);
    }

    function handleKey(event: KeyboardEvent, press: boolean = false) {
        // Only handle keystrokes when this is focused.
        // Otherwise, we let any focusable elements in this editor handle them.
        if (!editorFocused) return;

        // Remember the time of this keystroke.
        lastInputTime = Date.now();
        keyboardIdle = false;

        if (caretRange === undefined) return;

        // Build some context
        const context = getCaretContext();

        if (context === undefined) return;

        // Loop through the commands to see if there's a match.
        const unmatched = commands.every((command) => {
            // If the keystroke and caret position matches the command signature, execute the command and update the caret range.
            if (
                (command.press === undefined || command.press === press) &&
                (command.shift === undefined ||
                    command.shift === event.shiftKey) &&
                (command.alt === undefined || command.alt === event.altKey) &&
                (command.control === undefined ||
                    command.control === (event.ctrlKey || event.metaKey)) &&
                (command.key === undefined ||
                    (Array.isArray(command.key) &&
                        command.key.includes(event.key)) ||
                    (command.key instanceof Function &&
                        command.key(event.key)) ||
                    command.key === event.key) &&
                (command.code === undefined || command.code === event.code) &&
                (command.active === true ||
                    (command.active instanceof Function &&
                        command.active.call(undefined, context, event.key)))
            ) {
                // Execute the command
                const handled = executeCommand(command, event.key);

                if (handled) {
                    event.preventDefault();
                    event.stopPropagation();
                }

                // Stop searching for a matching command.
                return handled;
            }
            // Continue searching for a matching command.
            return true;
        });

        if (unmatched) {
            // Toolbar navigation
            if (event.key === 'Escape') {
                // If we've selected a FootnoteNode or Comment, navigate to the footnote or comment text to edit it.
                if (
                    caretRange.start.node instanceof AtomNode &&
                    caretRange.start.node.getMeta() instanceof FormatNode
                ) {
                    const firstCaret = caretRange.start.node
                        .getMeta()
                        .getFirstCaret();
                    caretRange = { start: firstCaret, end: firstCaret };
                    event.preventDefault();
                    event.stopPropagation();
                    return true;
                }
                // If we're inside an atom node, select the atom itself.
                else if (caretRange.start.node.isInside(editedNode, AtomNode)) {
                    const atom = caretRange.start.node.getClosestParentOfType<
                        AtomNode<any>
                    >(editedNode, AtomNode);
                    if (atom) {
                        const atomCaret = { node: atom, index: 0 };
                        caretRange = { start: atomCaret, end: atomCaret };
                        event.preventDefault();
                        event.stopPropagation();
                        return true;
                    }
                }
                // Otherwise, if we have a reference to this editor's DOM element, find the nearest focusable element in it's toolbar and focus on that.
                const controls = [
                    document.querySelector(
                        '.bookish-editor-toolbar [tabindex="0"]'
                    ),
                    document.querySelector('.bookish-editor-toolbar input'),
                    document.querySelector('.bookish-editor-toolbar select'),
                    document.querySelector('.bookish-editor-toolbar button'),
                ];
                const match = controls.find(
                    (control) => control && control instanceof HTMLElement
                );
                if (match && match instanceof HTMLElement) {
                    match.focus();
                    event.preventDefault();
                    event.stopPropagation();
                    return true;
                }
            }
        }
    }

    function executeCommand(command: Command, key: string): boolean {
        // Assume we process it, then flip it if we don't.
        ignoredInput = false;

        const context = getCaretContext();
        if (context && caretRange) {
            const results = command.handler.call(
                undefined,
                context,
                getUtilities(),
                key
            );

            // If the command invoked produced a new range
            if (results !== undefined) {
                const { root, range } = results;
                const newRange = { start: range.start, end: range.end };

                if (root === editedNode && command.mutates)
                    console.error(
                        `Warning: immutability violation on ${command.description}`
                    );

                // Set the range to force a rerender, assuming something in the document changed.
                caretRange = newRange;

                // Save the copy in the undo stack if this isn't a navigation or selection state.
                if (
                    command.category !== 'navigation' &&
                    command.category !== 'selection' &&
                    command.category !== 'history'
                ) {
                    saveEdit(root as RootNode, newRange, command);
                }
                return true;
            } else {
                ignoredInput = true;
                return false;
            }
        }
        return false;
    }

    async function saveEdit(
        newRoot: RootNode,
        newRange: CaretRange,
        command?: Command
    ) {
        // Don't save edits if locked.
        if (locked) return;

        // Call the save callback.
        save(newRoot);

        // Initialize a new history if we don't have one.
        let newStack: UndoState[] = undoStack.length > 0 ? undoStack : [];

        // If there's nothing on the stack, save the initial state before we add something to the stack.
        if (undoStack.length === 0 && caretRange !== undefined) {
            const currentRange = caretRangeToIndexRange(editedNode, caretRange);
            if (currentRange !== undefined)
                newStack = [
                    {
                        bookdown: editedNode.toBookdown(),
                        command: undefined,
                        range: currentRange,
                    },
                ];
        }

        // Change the chapter's AST.
        updateRoot(newRoot);

        // Set the new undo stack, pre-pending the new command to the front.
        const newTextRange = caretRangeToIndexRange(newRoot, newRange);
        if (newTextRange !== undefined)
            undoStack = [
                {
                    bookdown: newRoot.toBookdown(),
                    command: command,
                    range: newTextRange,
                    // If the undo position is beyond the front, clear everything before it, because we're changing history.
                },
                ...(undoPosition > 0 ? newStack.slice(undoPosition) : newStack),
            ];

        // Set the undo position to the last index.
        undoPosition = 0;

        // Focus the editor on the new caret location, unless the toolbar is focused.
        if (!toolbarIsFocused()) element?.focus();

        // Update the caret
        claimActiveEditor();
    }

    function updateRoot(newRoot: RootNode) {
        editedNode = newRoot;
        text = editedNode.toBookdown();
    }

    function editNode(previous: BookishNode, edited: BookishNode) {
        if (caretRange) {
            const newRoot = editedNode.withNodeReplaced(previous, edited);
            if (newRoot === undefined) return;
            saveEdit(newRoot, { start: caretRange.start, end: caretRange.end });

            // Update the range if the current range contains the previous node. This will generally
            // be true any time a selected atom node is edited.
            if (
                caretRange.start.node === previous &&
                (edited instanceof AtomNode || edited instanceof TextNode)
            )
                caretRange = {
                    start: { node: edited, index: 0 },
                    end: { node: edited, index: 0 },
                };
        }
    }

    function handleMouseDown() {
        if (!element) return;

        // Grab focus.
        element.focus();

        // Update the caret range to ensure it's positioned correctly, since it depends on relative positioned parents.
        if (caretRange)
            caretRange = { start: caretRange.start, end: caretRange.end };

        // If we've selected a non-TextNode, release it, so the browser is free to select a text node.
        if (
            caretRange &&
            !(
                caretRange.start.node instanceof TextNode ||
                caretRange.start.node instanceof AtomNode ||
                caretRange.start.node instanceof EmbedNode
            )
        ) {
            caretRange = undefined;
        }
    }

    function isFocused() {
        return (
            document.activeElement === element ||
            (element !== null && element?.contains(document.activeElement)) ||
            toolbarIsFocused()
        );
    }

    function handleFocus() {
        editorFocused = isFocused();
        lease(true);
    }

    function handleBlur() {
        editorFocused = isFocused();
        lease(false);
    }

    function handleCopy(node: BookishNode) {
        // Set the editor's clipboard.
        clipboard = node;

        // Set the OS clipboard.
        if (navigator.clipboard) {
            navigator.clipboard.write([
                new ClipboardItem({
                    'text/plain': new Blob([node.toText()], {
                        type: 'text/plain',
                    }),
                    'text/html': new Blob([node.toHTML()], {
                        type: 'text/html',
                    }),
                }),
            ]);
        } else
            window.alert(
                "Your browser doesn't support copying to the clipboard :("
            );
    }

    function handlePaste(
        context: WhatsAroundTheCaret,
        text: PasteContent | BookishNode,
        save: boolean
    ) {
        if (text instanceof BookishNode)
            return handlePasteNode(context, text, save);

        const plain =
            text.plain === undefined ? undefined : new TextNode(text.plain);

        if (plain) {
            const edit = handlePasteNode(context, plain, save);
            if (edit) return edit;
        }
        return undefined;
    }

    function handlePasteNode(
        context: WhatsAroundTheCaret,
        node: BookishNode,
        save: boolean
    ) {
        // Track revisions in these two variables.
        let newRoot = context.root;
        let newCaret = context.start;

        // Is there any text to remove? Remove it first.
        if (context.isSelection) {
            const edit = newRoot.withRangeFormatted(context.range, undefined);
            if (edit === undefined || !(edit.root instanceof ChapterNode))
                return;
            newRoot = edit.root;
            newCaret = edit.range.start;
        }

        // Find the parents of the caret node, from nearest to furthest
        const parents = context.root.getParentsOf(newCaret.node);
        if (parents === undefined) return;

        // Pop parents, nearest to farthest, searching for one that handles an insertion.
        let edit = undefined;
        let parent = undefined;
        while (parents.length > 0) {
            parent = parents.pop();
            if (parent === undefined) break;
            // It's critical that we insert a copy and not the node in case people copy multiple times. A node can only appear once in a tree.
            edit = parent.withNodeInserted(newCaret, node.copy());
            if (edit !== undefined) break;
        }

        // Insert the node at the caret.
        if (parent !== undefined && edit !== undefined) {
            const newChapter = context.root.withNodeReplaced(parent, edit.root);
            if (newChapter === undefined) return;

            if (save) {
                // Set the range to force a rerender, assuming something in the document changed.
                caretRange = edit.range;

                // Save the copy in the undo stack if this isn't a navigation or selection state.
                saveEdit(newChapter, edit.range);
            } else return { root: newChapter, range: edit.range };
        }
    }

    function toolbarIsFocused() {
        const toolbar = document.querySelector('.bookish-editor-toolbar');
        return toolbar !== null && toolbar.contains(document.activeElement);
    }

    $: isAtom = caretRange && caretRange.start.node instanceof AtomNode;
    $: inAtom =
        caretRange && caretRange.start.node.isInside(editedNode, AtomNode);
    $: isSelection =
        caretRange !== undefined &&
        (caretRange.start.node !== caretRange.end.node ||
            caretRange.start.index !== caretRange.end.index);
    $: isItalic =
        caretRange !== undefined &&
        isSelection === false &&
        caretRange.start.node instanceof TextNode &&
        caretRange.start.node.isItalic(editedNode);
    $: isBold =
        caretRange !== undefined &&
        isSelection === false &&
        caretRange.start.node instanceof TextNode &&
        caretRange.start.node.isBold(editedNode);
    $: isLink =
        caretRange !== undefined &&
        isSelection === false &&
        caretRange.start.node.getClosestParentMatching(
            editedNode,
            (p) => p instanceof LinkNode
        ) !== undefined;

    // When the caret context or editor focus changes, update the active editor.
    $: {
        if ((caretRange || editorFocused) && isFocused()) claimActiveEditor();
        else activeEditor.set(undefined);
    }

    function claimActiveEditor() {
        activeEditor.set({
            range: caretRange,
            coordinate: caretCoordinate,
            setCaret: (range: CaretRange | undefined) => {
                caretRange = range;
                element?.focus();
            },
            edit: editNode,
            executor: executeCommand,
            context: getCaretContext(),
            root: editedNode,
            focused: editorFocused,
        });
    }

    // Pass the function above to all children so they can claim the active editor for non-focus reasons.
    // (Drag and drop, for example.)
    setContext('claimeditor', claimActiveEditor);
</script>

<div
    class={`bookish-editor ${inAtom ? 'bookish-editor-atom-focused' : ''}`}
    class:locked
    aria-disabled={locked}
    bind:this={element}
    on:keydown={handleKey}
    on:keypress={handlePress}
    on:mousedown|stopPropagation={handleMouseDown}
    on:focus={handleFocus}
    on:blur={handleBlur}
    tabIndex="0"
>
    <!-- A view of the root -->
    <svelte:component
        this={component}
        node={editedNode}
        {placeholder}
        editable={true}
    />
    <!-- The caret. We render our own since this view isn't contentEditable and we can't show a caret.
         Customize the rendering based on the formatting applied to the text node. -->
    {#if caretCoordinate && caretRange && !isAtom && isSelection === false && editorFocused}
        <CaretView
            left={caretCoordinate.x}
            top={caretCoordinate.y}
            height={caretCoordinate.height}
            blink={editorFocused && keyboardIdle}
            ignored={ignoredInput}
            linked={isLink}
            bold={isBold}
            italic={isItalic}
            disabled={!editorFocused || locked}
            {locked}
        />
    {/if}
</div>

<style>
    .bookish-editor {
        min-height: 1em;
    }

    .locked :global(.bookish-text) {
        color: var(--app-muted-color);
    }

    .bookish-editor:focus {
        outline: var(--app-chrome-border-size) solid
            var(--app-interactive-color);
        outline-offset: var(--app-chrome-padding);
        border-radius: var(--app-chrome-roundedness);
    }

    .bookish-editor.bookish-editor-atom-focused:focus {
        outline: none;
    }

    .bookish-editor-inline-editor {
        display: inline-block;
        position: relative;
    }

    .bookish-editor-inline-form {
        position: absolute;
        left: 0;
        top: 0;
        min-width: 7em;
        width: auto;
        z-index: 2;
    }

    .bookish-link-active {
        font-weight: bold;
    }

    .bookish-editor :global(hr) {
        margin-top: 1em;
        margin-bottom: 1em;
    }
</style>
