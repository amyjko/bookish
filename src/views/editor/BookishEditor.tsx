import React, { useContext, useEffect, useRef, useState } from "react"
import { ChapterNode } from "../../models/ChapterNode";
import { Caret, CaretRange, TextRange } from "../../models/Caret";
import { LinkNode } from "../../models/LinkNode";
import { ParagraphNode } from "../../models/ParagraphNode";
import { TextNode } from "../../models/TextNode";
import { renderNode } from "../chapter/Renderer";
import { AtomNode } from "../../models/AtomNode";
import { FormatNode } from "../../models/FormatNode";
import { BlocksNode } from "../../models/BlocksNode";
import { ListNode } from "../../models/ListNode";
import { TableNode } from "../../models/TableNode";
import { Node as BookishNode } from "../../models/Node";
import { MetadataNode } from "../../models/MetadataNode";
import { RootNode } from "../../models/RootNode";
import { Edit } from "../../models/Edit";

import { Command, commands } from "./Commands";
import Toolbar from "./Toolbar";
import Parser from "../../models/Parser";
import { ChapterContext, ChapterContextType } from "../chapter/Chapter";

export type CaretContextType = { 
    range: CaretRange | undefined, 
    coordinate: { x: number, y: number} | undefined,
    setCaretRange: Function,
    forceUpdate: Function,
    context: CaretState | undefined,
    edit: (previous: BookishNode, edited: BookishNode) => void,
    root: RootNode,
    focused: boolean
} | undefined;

export const CaretContext = React.createContext<CaretContextType>(undefined);

export type CaretState = {
    chapter: boolean,
    range: CaretRange,
    start: Caret,
    end: Caret,
    isSelection: boolean,
    root: RootNode, 
    blocks: BlocksNode | undefined,
    paragraph: ParagraphNode | undefined,
    includesList: boolean,
    list: ListNode | undefined,
    table: TableNode | undefined,
    format: FormatNode | undefined, 
    atom: AtomNode<any> | undefined,
    meta: MetadataNode<any> | undefined,
    startIsText: boolean,
    endIsText: boolean,
    startIsTextOrAtom: boolean, 
    endIsTextOrAtom: boolean,
    atParagraphStart: boolean,
    undoStack: UndoState[],
    undoPosition: number,
    undo: () => Edit,
    redo: () => Edit,
    clipboard: Clipboard,
    setClipboard: React.Dispatch<React.SetStateAction<Clipboard>>
}

export type Clipboard = undefined | BookishNode;

export type UndoState = {
    command: Command | undefined,
    bookdown: string,
    range: TextRange
}

export type CaretUtilities = {
    getCaretOnLine: (caret: Caret, below: boolean) => Caret
}

const IDLE_TIME = 500;

const BookishEditor = <RootType extends RootNode>(props: { 
    ast: RootType,
    save: (node: RootType) => Promise<void> | undefined,
    chapter: boolean
}) => {

    const editorRef = useRef<HTMLDivElement>(null);

    const [ caretRange, setCaretRange ] = useState<CaretRange>();
    const [ caretCoordinate, setCaretCoordinate ] = useState<{ x: number, y: number, height: number}>();
    const [ lastInputTime, setLastInputTime ] = useState<number>(0);
    const [ unsavedEdits, setUnsavedEdits ] = useState<number>(0);
    const [ keyboardIdle, setKeyboardIdle ] = useState<boolean>(true);
    const [ editorFocused, setEditorFocused ] = useState<boolean>(true);
    const [ undoStack, setUndoStack ] = useState<UndoState[]>([]);
    const [ undoPosition, setUndoPosition ] = useState<number>(-1);
    const [ clipboard, setClipboard ] = useState<Clipboard>(undefined);
    const [ saving, setSaving ] = useState<undefined | string>(undefined);
    const [ editedNode, setEditedNode ] = useState<RootType>(props.ast);

    const chapterContext = useContext<ChapterContextType>(ChapterContext);

    const editedNodeRef = useRef<RootType>(editedNode);

    useEffect(() => {
        editedNodeRef.current = editedNode;
    }, [editedNode]);

    useEffect(() => {
    
        // Focus the editor on load.
        if(editorRef.current) {
            const text = editedNode.getTextNodes();
            if(text.length > 0) {
                const caret = { node: text[0], index: 0 };
                setCaretRange({ start: caret, end: caret });
                editorRef.current.focus();
            }
        }

        // Listen to selection changes
        document.addEventListener("selectionchange", handleSelectionChange);

        // Stop listening to selection changes
        return () => {
            document.removeEventListener("selectionchange", handleSelectionChange);
        }
    
    }, []);

    useEffect(() => {
        // When input happens, set a timer and then see if idle time has elapsed. If it ihas, Track time since last keystroke to control caret blinking behavior.
        const keystrokeTimer = setTimeout(() => { 
            // Remember that we're idle so we can render things accordingly.
            const isIdle = Date.now() - lastInputTime > IDLE_TIME;
            if(isIdle) {
                setKeyboardIdle(true);
                if(unsavedEdits > 0) {
                    const promise = props.save(editedNode);
                    if(promise) {
                        setSaving("Saving...")
                        promise
                            .then(() => setSaving("Saved."))
                            .catch((message: Error) => setSaving("Unable to save :("))
                            .finally(() => setUnsavedEdits(0))
                    }
                }
            }
            // Save
        }, IDLE_TIME);
        return () => {
            // Clear the timer if we're unmounting or re-rendering.
            clearTimeout(keystrokeTimer);
        }
    }, [lastInputTime, unsavedEdits])

    // When the selection changes, set the browser's selection to correspond. This helps with two things:
    // 1) we can rely on the browser to render selections rather than rendering it ourselves.
    // 2) We can measure the caret position, so we can render our own fancy one rather than relying on inconsistent cross browser behavior.
    useEffect(() => {

        // Grab the focus if we're focused on a text node.
        if(caretRange && caretRange.start.node instanceof TextNode && editorRef.current) {
            editorRef.current.focus();
        }

        // Measure the location of the selection using the browser's selection.
        let docSelection = document.getSelection();
        let newCaretPosition = undefined;
        if(docSelection) {
            if(caretRange) {
                
                // Browsers don't render backwards ranges, so we sort this before measuring.
                const sortedRange = caretRange;
                let startNode = document.querySelector(`[data-nodeid='${sortedRange.start.node.nodeID}`);
                let endNode = document.querySelector(`[data-nodeid='${sortedRange.end.node.nodeID}`);

                // If we found both selected nodes and we have a reference to the DOM, update the 
                // browser's selection if necessary and measure it's position so we can draw our own caret.
                if(startNode && endNode && editorRef.current) {

                    // If the current selection isn't different from the new one, then we don't do any of this.
                    // This prevents an infinite loop when, for example, the user clicks, the browser selection changes, 
                    // and we update the caret range, which updates the browser selection, ad infinitum.
                    let rangeChanged = true;
                    let currentRange = undefined;
                    if(docSelection.rangeCount > 0) {
                        currentRange = docSelection.getRangeAt(0);
                        // If our caret range is non-empty TextNodes at a particular index and equal to the browser's caret range, then nothing's changed, so we shouldn't update the selection.
                        const startIsEqual = 
                            (startNode.childNodes.length > 0 && currentRange.startContainer === startNode.childNodes[0] && currentRange.startOffset === sortedRange.start.index)
                        const endIsEqual = 
                            (endNode.childNodes.length > 0 && currentRange.endContainer === endNode.childNodes[0] && currentRange.endOffset === sortedRange.end.index)
                        if(startIsEqual && endIsEqual)
                            rangeChanged = false;
                    }

                    // We always aim for the DOM text nodes inside of bookish-text, but when the text nodes are the empty string, React doesn't
                    // render a DOM text node, and browsers often render an empty bounding box in this case. To measure the caret position,
                    // we insert a zero-width space in the empty span, then remove it after measurement.
                    // We only do this to the end node if it's different from the start node.
                    // We leave them in there so that the "rangeChanged" guard below can track them.
                    const emptyStart = startNode.childNodes.length === 0;
                    const emptyEnd = startNode !== endNode && endNode.childNodes.length === 0;
                    if(emptyStart)
                        startNode.appendChild(document.createTextNode('\ufeff'));
                    if(emptyEnd)
                        endNode.appendChild(document.createTextNode('\ufeff'));

                    // If we're just after a new line, set the selection to the character after.
                    const afterNewLine = 
                        sortedRange.start.node instanceof TextNode && 
                        sortedRange.start.index > 0 && 
                        sortedRange.start.node.getText().charAt(sortedRange.start.index - 1) === "\n";                        

                    // If the range has changed, set the selection so we can measure it's location.
                    // We guard this to avoid triggering unnecessary selection change events that don't actually modify the selection.
                    if(rangeChanged) {
                        try {
                            docSelection.setBaseAndExtent(startNode.childNodes[0], sortedRange.start.index, endNode.childNodes[0], sortedRange.end.index);
                        } catch(e) {
                            console.error(e);
                            throw Error(`Error setting caret range was set to ${startNode.childNodes[0]}:${sortedRange.start.index} - ${endNode.childNodes[0]}:${sortedRange.end.index}`);
                        }
                        currentRange = docSelection.getRangeAt(0);
                    }

                    // Measure and remember caret position
                    if(currentRange) {
                        const rangeRect = currentRange.getBoundingClientRect();
                        const textRect = startNode.getBoundingClientRect();
                        const pageRect = document.querySelector(".bookish-page")?.getBoundingClientRect();
                        const lineHeightString = window.getComputedStyle(startNode).getPropertyValue("line-height");
                        const lineHeight = lineHeightString.endsWith("px") ? parseInt(lineHeightString.substring(0, lineHeightString.length - 2)) : undefined;
                        // If we're after a new line, calculate the correct position, since selections don't actually render to the next line.
                        const left = afterNewLine ? textRect.left : rangeRect.left;
                        const top = afterNewLine && lineHeight ? rangeRect.top + lineHeight : rangeRect.top;
                        const position = {
                            x: left + window.scrollX - (pageRect ? pageRect.left + window.scrollX : 0),
                            y: top + window.scrollY - (pageRect ? pageRect.top + window.scrollY : 0),
                            height: rangeRect.height
                        };
                        newCaretPosition = position;

                    }
                }
            }
            // If the range is empty, remove the browser's selection too.
            else {
                document.getSelection()?.empty();
            }
        }

        // Save the new caret position so we render it.
        setCaretCoordinate(newCaretPosition);

        // If the caret position is outside the window, scroll to make it visible.
        if(newCaretPosition) {
            const caretTop = newCaretPosition.y;
            const caretBottom = caretTop + newCaretPosition.height;
            const windowHeight = window.innerHeight;
            const toolbar = editorRef.current?.querySelector(".bookish-editor-toolbar");
            const toolbarHeight = toolbar ? toolbar.clientHeight : 0;

            const buffer = newCaretPosition.height * 5;
            if(caretTop < window.scrollY + buffer + toolbarHeight) {
                window.scrollTo({ top: caretTop - buffer, behavior: 'smooth'  });
            }
            else if(caretBottom > window.scrollY + windowHeight - buffer) {
                window.scrollTo({ top: caretBottom - (windowHeight - buffer), behavior: 'smooth'  }); 
            }

        }

    }, [ caretRange ]);

    function rangeToCaret(domNode: Node, rangeIndex: number) {

        const currentNode = editedNodeRef.current;

        // If it's a text node, find the closest TextNode parent
        if(domNode.nodeType === Node.TEXT_NODE) {
            let parent = domNode.parentNode;
            // Keep looking up until we find the TextNode span with the node ID.
            while(parent && !(parent instanceof HTMLElement && parent.classList.contains("bookish-text")))
                parent = parent.parentNode;
            if(parent && parent.dataset.nodeid) {
                const node = currentNode.getNode(parseInt(parent.dataset.nodeid));
                if(node instanceof TextNode)
                    // Account for the zero-width spaces that we insert in order to make selections possible on empty text nodes.
                    return { node: node, index: Math.min(rangeIndex, node.getLength()) };
            }
        }
        // If it's an element, see if it has a nodeID and handle it accordingly.
        else if(domNode.nodeType === Node.ELEMENT_NODE && domNode instanceof HTMLElement && domNode.dataset.nodeid) {
            const node = currentNode.getNode(parseInt(domNode.dataset.nodeid));
            // These assume that triple clicks on paragraphs in the browser choose text nodes for the selection start
            // and spans or paragraph nodes for the end.
            if(node instanceof ParagraphNode) {
                const first = node.getFirstTextNode();
                return { node: first, index: 0 };
            }
            else if(node instanceof TextNode) {
                return { node: node, index: 0 };
            }
        }

        // Return nothing by default.
        return undefined;

    }

    function handleSelectionChange() {
        
        // Make sure we're showing the caret.
        setLastInputTime(Date.now());
        setKeyboardIdle(false);

        // Map the browser selection to our caret range model.
        const selection = document.getSelection();

        if(selection && selection.anchorNode && selection.anchorOffset && selection.focusNode && selection.focusOffset) {
            const start = rangeToCaret(selection.anchorNode, selection.anchorOffset);
            const end = rangeToCaret(selection.focusNode, selection.focusOffset);
            // If we found to text nodes, set the selection
            if(start && end) {
                setCaretRange({ start: start, end: end });
            }
        }

    }

    function getCaretCoordinate(caret: Caret) : { top: number, left: number, height: number } | undefined {

        if(!(caret.node instanceof TextNode || caret.node instanceof AtomNode)) 
            return undefined;
        const domNode = document.querySelector(`[data-nodeid='${caret.node.nodeID}`);
        // If we didn't find the node or there's no text node inside it, then there's no caret position.
        // This happens temporarily before the useEffect above has a chance to insert zero-width non-breaking space.
        if(domNode === null || domNode.childNodes.length === 0) return undefined;
        const range = document.createRange();
        range.setStart(domNode.childNodes.length === 0 ? domNode : domNode.childNodes[0], domNode.childNodes.length === 0 ? 0 : caret.index);
        const characterRect = range.getBoundingClientRect();
        if(characterRect.left > 0)
            return { top: characterRect.top, left: characterRect.left, height: characterRect.height };
        const elementRect = domNode.getBoundingClientRect();
        return { top: elementRect.top, left: elementRect.left, height: elementRect.height };

    }

    function getCaretOnLine(caret: Caret, below: boolean) : Caret {

        if(caret.node instanceof TextNode || caret.node instanceof AtomNode) {
            // Find the position of the current start node.
            const startCoordinate = getCaretCoordinate(caret);
            let candidate = editedNode.getAdjacentCaret(caret, below);
            if(candidate === undefined) return caret;
            let previousCandidate = undefined;
            let previousCoordinate = undefined;
            if(startCoordinate) {
                while(candidate.node instanceof TextNode || candidate.node instanceof AtomNode) {
                    const candidateCoordinate = getCaretCoordinate(candidate);                    
                    // Did we make it to the next line and the character before/after? If we're going down,
                    // we're looking for a top that's below the bottom. If we're going up, we're looking for a bottom
                    // that's below the top.
                    if(candidateCoordinate) {
                        const startTop = startCoordinate.top;
                        const candidateTop = candidateCoordinate.top;
                        const closerCandidate = previousCoordinate && previousCandidate && Math.abs(startCoordinate.left - previousCoordinate.left) < Math.abs(startCoordinate.left - candidateCoordinate.left) ? previousCandidate : candidate;
                        if(below) {
                            // If this candidate is on the line below the start line, then return the last candidate on the line below the start line.
                            if(previousCandidate && previousCoordinate && previousCoordinate.top > startTop + startCoordinate.height && candidateTop > previousCoordinate.top + previousCoordinate.height)
                                return previousCandidate;
                            // If this is just below the start position, stop and return the closer of the current and previous candidates.
                            else if(candidateTop > startTop + startCoordinate.height && candidateCoordinate.left >= startCoordinate.left)
                                return closerCandidate;
                        } else {
                            // If this candidate is on the live above the line above the start line, then return the last candidate on the line above the start line.
                            if(previousCandidate && previousCoordinate && previousCoordinate.top + previousCoordinate.height < startTop && candidateTop + candidateCoordinate.height < previousCoordinate.top)
                                return previousCandidate;
                            // If this is just above the start position, stop and return the closer of the current and previous candidates.
                            if(candidateTop + candidateCoordinate.height < startTop && candidateCoordinate.left <= startCoordinate.left)
                                return closerCandidate;    
                        }
                    }

                    // Get the next candidate to consider.
                    const nextCandidate: Caret | undefined = editedNode.getAdjacentCaret(candidate, below);
                    if(nextCandidate === undefined) break;

                    // If the caret didn't move, we stop searching, something is wrong.
                    if(nextCandidate.node === candidate.node && nextCandidate.index === candidate.index) {
                        break;
                    }

                    // Otherwise, we advance to the next candidate.
                    previousCandidate = candidate;
                    previousCoordinate = candidateCoordinate;
                    candidate = nextCandidate;

                    if(candidate === undefined) return caret;

                }
                return candidate;
            }
        }

        // If we didn't find one, just return what we were given.
        return caret;

    }

    function atParagraphStart(): boolean {
        if( caretRange === undefined ||
            caretRange.start.node !== caretRange.end.node ||
            caretRange.start.index !== caretRange.end.index || 
            !(caretRange.start.node instanceof TextNode))
            return false;

        const firstCaret = caretRange.start.node.getFormatRoot(editedNode)?.getFirstCaret();
        return firstCaret !== undefined && firstCaret.node === caretRange.start.node && firstCaret.index === caretRange.start.index;
    }

    function undo(): Edit {

        // Grab the next state
        let undoState = undoStack[undoPosition + 1];

        // Restore the content of the chapter.
        let node = props.ast instanceof ChapterNode ? 
            Parser.parseChapter(chapterContext.book, undoState.bookdown) : 
            Parser.parseFormat(chapterContext.book, undoState.bookdown)
        setEditedNode(node as RootType);

        // Move the undo state down a position.
        if(undoPosition < undoStack.length)
            setUndoPosition(undoPosition + 1);

        // Return the original caret.
        const range = node.textRangeToCaret(undoState.range);
        if(range === undefined) return;
        return { root: node, range: range };

    }

    function redo(): Edit {

        // Grab the next state
        let undoState = undoStack[undoPosition - 1];

        // Restore the content of the chapter.
        let node = props.ast instanceof ChapterNode ? 
            Parser.parseChapter(chapterContext.book, undoState.bookdown) : 
            Parser.parseFormat(chapterContext.book, undoState.bookdown)
        setEditedNode(node as RootType);

        // Move the undo state down a position.
        if(undoPosition > 0)
            setUndoPosition(undoPosition - 1);

        // Return the original caret.
        const range = node.textRangeToCaret(undoState.range);
        if(range === undefined) return;
        return { root: node, range: range };

    }

    function getCaretContext(): CaretState | undefined {
        if(caretRange === undefined)
            return undefined;

        // Determine whether the range contains a list
        const nodes = editedNode.getNodes();
        let inside = false;
        let includesList = false;
        nodes.forEach(n => {
            if(n === caretRange.start.node) inside = true;
            if(inside && n.getClosestParentMatching(editedNode, p => p instanceof ListNode) !== undefined) includesList = true;
            if(n === caretRange.end.node) inside = false;
        });

        const parents = editedNode.getParentsOf(caretRange.start.node)?.reverse();

        return { 
            // We make a new range so that setCaretRange always causes a re-render
            chapter: props.chapter,
            range: { start: caretRange.start, end: caretRange.end },
            start: caretRange.start,
            end: caretRange.end,
            isSelection: caretRange.start.node !== caretRange.end.node || caretRange.start.index !== caretRange.end.index,
            root: editedNode,
            blocks: parents?.find(n => n instanceof BlocksNode) as BlocksNode,
            paragraph: parents?.find(n => n instanceof ParagraphNode) as ParagraphNode,
            list: parents?.find(n => n instanceof ListNode) as ListNode,
            atom: parents?.find(n => n instanceof AtomNode) as AtomNode<any>,
            meta: parents?.find(n => n instanceof MetadataNode) as MetadataNode<FormatNode>,
            includesList: includesList,
            table: parents?.find(n => n instanceof TableNode) as TableNode,
            format: (caretRange.end.node instanceof TextNode || caretRange.end.node instanceof AtomNode) ? caretRange.end.node.getFormatRoot(editedNode) : undefined,
            startIsText: caretRange.start.node instanceof TextNode,
            endIsText: caretRange.end.node instanceof TextNode,
            startIsTextOrAtom: caretRange.start.node instanceof TextNode || caretRange.start.node instanceof AtomNode,
            endIsTextOrAtom: caretRange.end.node instanceof TextNode || caretRange.end.node instanceof AtomNode,
            atParagraphStart: atParagraphStart(),
            undoStack: undoStack,
            undoPosition: undoPosition,
            undo: undo,
            redo: redo,
            clipboard: clipboard,
            setClipboard: setClipboard
        };
    }

    function getUtilities(): CaretUtilities {
        return {
            getCaretOnLine: getCaretOnLine
        };
    }

    function handleKeyDown(event: React.KeyboardEvent) {

        // Only handle keystrokes when this is focused.
        // Otherwise, we let any focusable elements in this editor handle them.
        if(document.activeElement !== editorRef.current)
            return;

        // Remember the time of this keystroke.
        setLastInputTime(Date.now());
        setKeyboardIdle(false);

        if(caretRange === undefined)
            return;

        // Build some context
        const context = getCaretContext();

        if(context === undefined)
            return;

        // Loop through the commands to see if there's a match.
        const unmatched = commands.every(command => {
            // If the keystroke and caret position matches the command signature, execute the command and update the caret range.
            if( (command.shift === undefined || command.shift === event.shiftKey) && 
                command.alt === event.altKey &&
                command.control === (event.ctrlKey || event.metaKey) &&
                (command.key === undefined || command.key === event.key || (Array.isArray(command.key) && command.key.includes(event.key))) &&
                (command.code === undefined || command.code === event.code) &&
                (command.active === true || (command.active instanceof Function && command.active.call(undefined, context, event.key)))) {

                    event.preventDefault();
                    event.stopPropagation();

                    // Execute the command
                    executeCommand(command, event.key);
                    
                    // Stop searching for a matching command.
                    return false;
            }
            // Continue searching for a matching command.
            return true;
        });

        if(unmatched) {
            // Toolbar navigation
            if(event.key === "Tab") {
                event.preventDefault();
                event.stopPropagation();

                // If we've selected a FootnoteNode or Comment, navigate to the footnote or comment text.
                if(caretRange.start.node instanceof AtomNode && caretRange.start.node.getMeta() instanceof FormatNode) {
                    const firstCaret = caretRange.start.node.getMeta().getFirstCaret();
                    setCaretRange({ start: firstCaret, end: firstCaret });
                    return true;
                }
                else if(caretRange.start.node.isInside(editedNode, AtomNode)) {
                    const atom = caretRange.start.node.getClosestParentOfType<AtomNode<any>>(editedNode, AtomNode);
                    if(atom) {
                        const atomCaret = { node: atom, index: 0 };
                        setCaretRange({ start: atomCaret, end: atomCaret });
                        return true;
                    }
                }

                if(editorRef.current) {
                    const controls = [
                        editorRef.current.querySelector(".bookish-editor-toolbar input"),
                        editorRef.current.querySelector(".bookish-editor-toolbar select"),
                        editorRef.current.querySelector(".bookish-editor-toolbar button")
                    ];
                    const match = controls.find(control => control && control instanceof HTMLElement);
                    if(match && match instanceof HTMLElement) {
                        match.focus();
                        return true;
                    }
                }
            }

        }

    }

    function executeCommand(command: Command, key: string) {

        const context = getCaretContext();
        if(context && caretRange) {

            const results = command.handler.call(
                undefined, 
                context,
                getUtilities(),
                key
            );

            // If the command invoked produced a new range
            if(results !== undefined && (results.root instanceof ChapterNode || results.root instanceof FormatNode)) {
                const { root, range } = results;
                const newRange = { start: range.start, end: range.end };

                if(root === editedNode && command.category !== "navigation" && command.category !== "selection")
                    console.error(`Warning: immutability violation on ${command.description}`);
        
                // Set the range to force a rerender, assuming something in the document changed.
                setCaretRange(newRange);
        
                // Save the copy in the undo stack if this isn't a navigation or selection state.
                if(command.category !== "navigation" && command.category !== "selection" && command.category !== "history") {
                    saveEdit(root as RootType, newRange, command);
                }
            
            }
            // TODO If there was no result, shake or something.
        }
    }

    function saveEdit(newRoot: RootType, newRange: CaretRange, command?: Command) {

        // Remember the last edit time so we can remember to save.
        if(command && command.category !== "navigation" && command.category !== "selection")
            setUnsavedEdits(unsavedEdits + 1);
    
        // Change the chapter's AST.
        setEditedNode(newRoot);

        // If the history is empty, record the current state.
        let newStack: UndoState[] = undoStack.length > 0 ? undoStack : [];  
        
        if(undoStack.length === 0 && caretRange !== undefined) {
            const currentRange = newRoot.caretRangeToTextRange(caretRange);
            if(currentRange !== undefined)
                newStack = [{ 
                    bookdown: newRoot.toBookdown(), 
                    command: undefined,
                    range: currentRange
                }];
        }

        // Set the new undo stack, pre-pending the new command to the front.
        const newTextRange = newRoot.caretRangeToTextRange(newRange);
        if(newTextRange !== undefined)
            setUndoStack([{ 
                bookdown: newRoot.toBookdown(),
                command: command,
                range: newTextRange
                // If the undo position is beyond the front, clear everything before it, because we're changing history.
            }, ...(undoPosition > 0 ? newStack.slice(undoPosition) : newStack)]);

        // Set the undo position to the last index.
        setUndoPosition(0);

    }

    function editNode(previous: BookishNode, edited: BookishNode) {
        if(caretRange) {
            const newRoot = editedNode.withNodeReplaced(previous, edited);
            if(newRoot === undefined) return;
            saveEdit(newRoot as RootType, { start: caretRange.start, end: caretRange.end });

            // Update the range if the current range contains the previous node. This will generally
            // be true any time a selected atom node is edited.
            if(caretRange.start.node === previous && (edited instanceof AtomNode || edited instanceof TextNode))
                setCaretRange({ start: { node: edited, index: 0 }, end: { node: edited, index: 0 }});

        }
    }

    function handleMouseDown() {
        
        if(!editorRef.current)
            return;

        // Grab focus.
        editorRef.current.focus();

        // If we've selected a non-TextNode, release it, so the browser is free to select a text node.
        if(caretRange && !(caretRange.start.node instanceof TextNode || caretRange.start.node instanceof AtomNode)) {
            setCaretRange(undefined);
        }

    }

    function handleKeyUp(event: React.KeyboardEvent) {
        event.preventDefault();
    }

    function forceUpdate() {

        if(caretRange !== undefined) {
            setCaretRange({ start: caretRange.start, end: caretRange.end }); 
        }

    }

    function handleFocus() {
        setEditorFocused(true);
    }

    function handleUnfocus() {
        if(document.activeElement !== null && editorRef.current !== null && !editorRef.current.contains(document.activeElement))
            setEditorFocused(false);
    }

    const isAtom = caretRange && caretRange.start.node instanceof AtomNode;
    const inAtom = caretRange && caretRange.start.node.isInside(editedNode, AtomNode);
    const isSelection = caretRange && (caretRange.start.node !== caretRange.end.node || caretRange.start.index !== caretRange.end.index);
    const isItalic = caretRange && !isSelection && caretRange.start.node instanceof TextNode && caretRange.start.node.isItalic(editedNode);
    const isBold = caretRange && !isSelection && caretRange.start.node instanceof TextNode && caretRange.start.node.isBold(editedNode);
    const isLink = caretRange && !isSelection && caretRange.start.node.getClosestParentMatching(editedNode, p => p instanceof LinkNode) !== undefined;
    const focused = document.activeElement === editorRef.current && document.hasFocus();

    const context = getCaretContext();

    return <CaretContext.Provider value={{ 
        range: caretRange, 
        coordinate: caretCoordinate, 
        setCaretRange: setCaretRange, 
        forceUpdate: forceUpdate,
        edit: editNode,
        context: context,
        root: editedNode,
        focused: focused
    }}>
            <div 
                className={`bookish-editor ${inAtom ? "bookish-editor-atom-focused" : ""}`}
                ref={editorRef}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onMouseDown={handleMouseDown}
                onFocus={handleFocus}
                onBlur={handleUnfocus}
                tabIndex={0} // Makes the editor focusable.
                >
                { context && caretCoordinate ? <Toolbar context={context} executor={executeCommand} saving={saving} visible={editorFocused}></Toolbar> : null }
                {
                    // Draw a caret. We draw our own since this view isn't contentEditable and we can't show a caret.
                    // Customize the rendering based on the formatting applied to the text node.
                    caretCoordinate && caretRange && !isAtom && !isSelection ? 
                        <div 
                            className={`bookish-editor-caret ${isLink ? "bookish-editor-caret-linked" : isItalic ? "bookish-editor-caret-italic" :""} ${isBold ? "bookish-editor-caret-bold" : ""} ${focused && keyboardIdle ? "bookish-editor-caret-blink" : ""} ${!focused ? "bookish-editor-caret-disabled" : ""}`}
                            style={{
                                left: caretCoordinate.x,
                                top: caretCoordinate.y,
                                height: caretCoordinate.height
                            }}>
                        </div> : null
                }
                { renderNode(editedNode) }
            </div>
        </CaretContext.Provider>
    ;
}

export default BookishEditor;