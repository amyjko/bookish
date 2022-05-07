import React, { useEffect, useRef, useState } from "react"
import { ChapterNode } from "../../models/ChapterNode";
import { Caret, CaretRange } from "../../models/Caret";
import { LinkNode } from "../../models/LinkNode";
import { ParagraphNode } from "../../models/ParagraphNode";
import { TextNode } from "../../models/TextNode";
import { renderNode } from "../chapter/Renderer";
import { AtomNode } from "../../models/AtomNode";
import { FormatNode } from "../../models/FormatNode";
import { BlocksNode } from "../../models/BlocksNode";
import { ListNode } from "../../models/ListNode";
import { TableNode } from "../../models/TableNode";
import { Command, commands } from "./Commands";
import Toolbar from "./Toolbar";

export const CaretContext = React.createContext<{ 
    range: CaretRange | undefined, 
    coordinate: { x: number, y: number} | undefined,
    setCaretRange: Function,
    forceUpdate: Function,
    focused: boolean
} | undefined>(undefined);

export type CaretState = {
    range: CaretRange,
    start: Caret,
    end: Caret,
    isSelection: boolean,
    chapter: ChapterNode | undefined, 
    blocks: BlocksNode | undefined,
    paragraph: ParagraphNode | undefined,
    includesList: boolean,
    list: ListNode | undefined,
    table: TableNode | undefined,
    format: FormatNode | undefined, 
    startIsText: boolean, 
    endIsText: boolean,
    startIsTextOrAtom: boolean, 
    endIsTextOrAtom: boolean,
    atParagraphStart: boolean
}

export type CaretUtilities = {
    getCaretOnLine: (caret: Caret, below: boolean) => Caret
}

const ChapterEditor = (props: { ast: ChapterNode }) => {

    const { ast } = props;
    const editorRef = useRef<HTMLDivElement>(null);

    const [ caretRange, setCaretRange ] = useState<CaretRange>();
    const [ caretCoordinate, setCaretCoordinate ] = useState<{ x: number, y: number, height: number}>();
    const [ lastInputTime, setLastInputTime ] = useState<number>(0);
    const [ keyboardIdle, setKeyboardIdle ] = useState<boolean>(true);
 
    useEffect(() => {
    
        // Focus the editor on load.
        if(editorRef.current) {
            const text = ast.getTextNodes();
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
        // Track time since last keystroke to control caret blinking behavior.
        const keystrokeTimer = setInterval(() => setKeyboardIdle((Date.now() - lastInputTime) > 300), 300);
        return () => {
            clearInterval(keystrokeTimer);
        }
    }, [lastInputTime])

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
            const toolbar = document.querySelector(".bookish-chapter-editor-toolbar");
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

        // If it's a text node, find the closest TextNode parent
        if(domNode.nodeType === Node.TEXT_NODE) {
            let parent = domNode.parentNode;
            // Keep looking up until we find the TextNode span with the node ID.
            while(parent && !(parent instanceof HTMLElement && parent.classList.contains("bookish-text")))
                parent = parent.parentNode;
            if(parent && parent.dataset.nodeid) {
                const node = ast.getNode(parseInt(parent.dataset.nodeid));
                if(node instanceof TextNode)
                    // Account for the zero-width spaces that we insert in order to make selections possible on empty text nodes.
                    return { node: node, index: Math.min(rangeIndex, node.getLength()) };
            }
        }
        // If it's an element, see if it has a nodeID and handle it accordingly.
        else if(domNode.nodeType === Node.ELEMENT_NODE && domNode instanceof HTMLElement && domNode.dataset.nodeid) {
            const node = ast.getNode(parseInt(domNode.dataset.nodeid));
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
            let candidate = below ? caret.node.next(caret.index) : caret.node.previous(caret.index);
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
                    const nextCandidate = below ? candidate.node.next(candidate.index) : candidate.node.previous(candidate.index);

                    // If the caret didn't move, we stop searching, something is wrong.
                    if(nextCandidate.node === candidate.node && nextCandidate.index === candidate.index) {
                        break;
                    }

                    // Otherwise, we advance to the next candidate.
                    previousCandidate = candidate;
                    previousCoordinate = candidateCoordinate;
                    candidate = nextCandidate;

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

        const firstCaret = caretRange.start.node.getFormatRoot()?.getFirstCaret();
        return firstCaret !== undefined && firstCaret.node === caretRange.start.node && firstCaret.index === caretRange.start.index;
    }

    function getCaretContext(): CaretState | undefined {
        if(caretRange === undefined)
            return undefined;

        // Determine whether the range contains a list
        const nodes = ast.getNodes();
        let inside = false;
        let includesList = false;
        nodes.forEach(n => {
            if(n === caretRange.start.node) inside = true;
            if(inside && n.getClosestParentMatching(p => p instanceof ListNode) !== undefined) includesList = true;
            if(n === caretRange.end.node) inside = false;
        });

        return { 
            // We make a new range so that setCaretRange always causes a re-render
            range: { start: caretRange.start, end: caretRange.end },
            start: caretRange.start,
            end: caretRange.end,
            isSelection: caretRange.start.node !== caretRange.end.node || caretRange.start.index !== caretRange.end.index,
            chapter: caretRange.start.node.getChapter(),
            blocks: caretRange.start.node.getClosestParentMatching(p => p instanceof BlocksNode) as BlocksNode,
            paragraph: caretRange.start.node.getClosestParentMatching(p => p instanceof ParagraphNode) as ParagraphNode,
            list: caretRange.start.node.getClosestParentMatching(p => p instanceof ListNode) as ListNode,
            includesList: includesList,
            table: caretRange.start.node.getClosestParentMatching(p => p instanceof TableNode) as TableNode,
            format: (caretRange.end.node instanceof TextNode || caretRange.end.node instanceof AtomNode) ? caretRange.end.node.getFormatRoot() : undefined,
            startIsText: caretRange.start.node instanceof TextNode,
            endIsText: caretRange.end.node instanceof TextNode,
            startIsTextOrAtom: caretRange.start.node instanceof TextNode || caretRange.start.node instanceof AtomNode,
            endIsTextOrAtom: caretRange.end.node instanceof TextNode || caretRange.end.node instanceof AtomNode,
            atParagraphStart: atParagraphStart()
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
            if( command.shift === event.shiftKey && 
                command.alt === event.altKey &&
                command.control === (event.ctrlKey || event.metaKey) &&
                (command.key === undefined || command.key === event.key || (Array.isArray(command.key) && command.key.includes(event.key))) &&
                (command.code === undefined || command.code === event.code) &&
                command.active.call(undefined, context)) {

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
            // If there's no modifier key pressed, and the key is one character, insert the character! This is a bit hacky: all but "Fn" are more than three characters.
            if(context.chapter !== undefined && !event.metaKey && !event.ctrlKey && !event.altKey && event.key.length === 1) {
                const caret = context.chapter.insertSelection(event.key, context.range);
                setCaretRange({ start: caret, end: caret });
                return true;
            }
            // Toolbar navigation
            else if(event.key === "Tab") {
                event.preventDefault();
                event.stopPropagation();
                const controls = [
                    document.querySelector(".bookish-chapter-editor-toolbar input"),
                    document.querySelector(".bookish-chapter-editor-toolbar select"),
                    document.querySelector(".bookish-chapter-editor-toolbar button")
                ];
                const match = controls.find(control => control && control instanceof HTMLElement);
                if(match && match instanceof HTMLElement) {
                    match.focus();
                    return true;
                }        
            }

        }

    }

    function executeCommand(command: Command, key: string) {
        const context = getCaretContext();
        if(context) {
            const newRange = command.handler.call(
                undefined, 
                context,
                getUtilities(),
                key
            );
            if(newRange)
                // Force a render
                setCaretRange({ start: newRange.start, end: newRange.end });
        }
    }

    function handleMouseDown(event: React.MouseEvent) {
        
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

        if(caretRange !== undefined)
            setCaretRange({ start: caretRange.start, end: caretRange.end }); 

    }

    function handleFocus() {
        forceUpdate();
    }

    function handleUnfocus() {
        forceUpdate();
    }

    const isAtom = caretRange && caretRange.start.node instanceof AtomNode;
    const isSelection = caretRange && (caretRange.start.node !== caretRange.end.node || caretRange.start.index !== caretRange.end.index);
    const isItalic = caretRange && !isSelection && caretRange.start.node instanceof TextNode && caretRange.start.node.isItalic();
    const isBold = caretRange && !isSelection && caretRange.start.node instanceof TextNode && caretRange.start.node.isBold();
    const isLink = caretRange && !isSelection && caretRange.start.node.getClosestParentMatching(p => p instanceof LinkNode) !== undefined;
    const focused = document.activeElement === editorRef.current && document.hasFocus();

    const context = getCaretContext();

    return <CaretContext.Provider value={{ 
        range: caretRange, 
        coordinate: caretCoordinate, 
        setCaretRange: setCaretRange, 
        forceUpdate: forceUpdate,
        focused: focused
    }}>
            <div 
                className="bookish-chapter-editor"
                ref={editorRef}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onMouseDown={handleMouseDown}
                onFocus={handleFocus}
                onBlur={handleUnfocus}
                tabIndex={0} // Makes the editor focusable.
                >
                { context && caretCoordinate ? <Toolbar chapter={props.ast} context={context} executor={executeCommand}></Toolbar> : null }
                {
                    // Draw a caret. We draw our own since this view isn't contentEditable and we can't show a caret.
                    // Customize the rendering based on the formatting applied to the text node.
                    caretCoordinate && caretRange && !isAtom && !isSelection ? 
                        <div 
                            className={`bookish-chapter-editor-caret ${isLink ? "bookish-chapter-editor-caret-linked" : isItalic ? "bookish-chapter-editor-caret-italic" :""} ${isBold ? "bookish-chapter-editor-caret-bold" : ""} ${focused && keyboardIdle ? "bookish-chapter-editor-caret-blink" : ""} ${!focused ? "bookish-chapter-editor-caret-disabled" : ""}`}
                            style={{
                                left: caretCoordinate.x,
                                top: caretCoordinate.y,
                                height: caretCoordinate.height
                            }}>
                        </div> : null
                }
                { renderNode(props.ast) }
                
            </div>
        </CaretContext.Provider>
    ;
}

export default ChapterEditor