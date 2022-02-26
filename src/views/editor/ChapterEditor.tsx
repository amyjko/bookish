import React, { useEffect, useRef, useState } from "react"
import { AtomNode } from "../../models/AtomNode";
import { ChapterNode, CaretRange, Caret } from "../../models/ChapterNode";
import { InlineCodeNode } from "../../models/InlineCodeNode";
import { LinkNode } from "../../models/LinkNode";
import { ParagraphNode } from "../../models/ParagraphNode";
import { TextNode } from "../../models/TextNode";
import { renderNode } from "../chapter/Renderer";

export const CaretContext = React.createContext<{ 
        selection: CaretRange | undefined, 
        rect: { x: number, y: number} | undefined,
        setCaretRange: Function
    }     | undefined>(undefined)

const ChapterEditor = (props: { ast: ChapterNode }) => {

    const { ast } = props;
    const editorRef = useRef<HTMLDivElement>(null);

    const [ caretRange, setCaretRange ] = useState<CaretRange>();
    const [ caretRect, setCaretRect ] = useState<{ x: number, y: number}>();
    const [ lastInputTime, setLastInputTime ] = useState<number>(0);
    const [ idle, setIdle ] = useState<boolean>(true);

    useEffect(() => {

        // Listen to selection changes
        document.addEventListener("selectionchange", handleSelectionChange);

        // Stop listening to selection changes
        return () => {
            document.removeEventListener("selectionchange", handleSelectionChange);
        }
    
    }, []);

    useEffect(() => {
        // Track time since last keystroke to control caret blinking behavior.
        const keystrokeTimer = setInterval(() => setIdle((Date.now() - lastInputTime) > 300), 300);
        return () => clearInterval(keystrokeTimer);
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

                    // We guard this to avoid triggering unnecessary selection change events that don't
                    // actually modify the selection.
                    if(rangeChanged) {
                        try {
                            docSelection.setBaseAndExtent(startNode.childNodes[0], sortedRange.start.index, endNode.childNodes[0], sortedRange.end.index);
                        } catch {
                            throw Error(`Error setting caret range was set to ${startNode.childNodes[0]}:${sortedRange.start.index} - ${endNode.childNodes[0]}:${sortedRange.end.index}`);
                        }
                        currentRange = docSelection.getRangeAt(0);
                    }

                    // Measure and remember caret position
                    if(currentRange) {
                        const rangeRect = currentRange.getBoundingClientRect();
                        const editorRect = editorRef.current.getBoundingClientRect();
                        const position = {
                            x: rangeRect.left - editorRect.left,
                            y: rangeRect.top - editorRect.top
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
        setCaretRect(newCaretPosition);

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
                    return { node: node, index: rangeIndex };
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
        setIdle(false);

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

    function getCaretCoordinate(caret: Caret) : { top: number, left: number } | undefined {

        if(!(caret.node instanceof TextNode)) return undefined;
        const domNode = document.querySelector(`[data-nodeid='${caret.node.nodeID}`);
        // If we didn't find the node or there's no text node inside it, then there's no caret position.
        // This happens temporarily before the useEffect above has a chance to insert zero-width non-breaking space.
        if(domNode === null || domNode.childNodes.length === 0) return undefined;
        const range = document.createRange();
        range.setStart(domNode.childNodes.length === 0 ? domNode : domNode.childNodes[0], domNode.childNodes.length === 0 ? 0 : caret.index);
        const rect = range.getBoundingClientRect();
        return { top: rect.top, left: rect.left };

    }

    function getCaretAbove(caret: Caret) { return getCaretOnLine(caret, false); }
    function getCaretBelow(caret: Caret) { return getCaretOnLine(caret, true); }

    function getCaretOnLine(caret: Caret, below: boolean) : Caret {

        if(caret.node instanceof TextNode) {
            // Find the position of the current start node.
            const startCoordinate = getCaretCoordinate(caret);
            let candidate = below ? caret.node.next(caret.index) : caret.node.previous(caret.index);
            let previousCandidate = undefined;
            let previousCoordinate = undefined;
            if(startCoordinate) {
                while(candidate.node instanceof TextNode) {
                    const candidateCoordinate = getCaretCoordinate(candidate);                    
                    // Did we make it to the next line and the character before/after?
                    if(candidateCoordinate) {
                        const closerCandidate = previousCoordinate && previousCandidate && Math.abs(startCoordinate.left - previousCoordinate.left) < Math.abs(startCoordinate.left - candidateCoordinate.left) ? previousCandidate : candidate;
                        if(below) {
                            // If this candidate is on the line below the line below the start line, then return the last candidate on the line below the start line.
                            if(previousCandidate && previousCoordinate && previousCoordinate.top > startCoordinate.top && candidateCoordinate.top > previousCoordinate.top)
                                return previousCandidate;
                            // If this is just below the start position, stop and return the closer of the current and previous candidates.
                            else if(candidateCoordinate.top > startCoordinate.top && candidateCoordinate.left >= startCoordinate.left)
                                return closerCandidate;
                        } else {
                            // If this candidate is on the live above the line above the start line, then return the last candidate on the line above the start line.
                            if(previousCandidate && previousCoordinate && previousCoordinate.top < startCoordinate.top && candidateCoordinate.top < previousCoordinate.top)
                                return previousCandidate;
                            // If this is just above the start position, stop and return the closer of the current and previous candidates.
                            if(candidateCoordinate.top < startCoordinate.top && candidateCoordinate.left <= startCoordinate.left)
                                return closerCandidate;    
                        }
                    }

                    // Get the next candidate to consider.
                    const nextCandidate = below ? candidate.node.next(candidate.index) : candidate.node.previous(candidate.index);

                    // If the caret didn't move, we stop searching.
                    if(nextCandidate.node === candidate.node && nextCandidate.index === candidate.index)
                        break;

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

    function handleKeyDown(event: React.KeyboardEvent) {

        // Only handle keystrokes when this is focused.
        // Otherwise, we let any focusable elements in this editor handle them.
        if(document.activeElement !== editorRef.current)
            return;

        // Remember the time of this keystroke.
        setLastInputTime(Date.now());
        setIdle(false);

        if(caretRange === undefined)
            return;

        // Command key can be control or meta
        const isCommand = event.ctrlKey || event.metaKey;

        // Move the caret right!
        if(event.key === "ArrowRight") {
            event.preventDefault();
            // What's to the right of the current selection's start?
            if(caretRange.start.node instanceof TextNode && caretRange.end.node instanceof TextNode) {
                const next = event.altKey ? caretRange.end.node.nextWord(caretRange.end.index) : caretRange.end.node.next(caretRange.end.index);
                const paragraph = caretRange.start.node.getParagraph();
                const last = paragraph.getLastTextNode();
                const lastCaret = { node: last, index: last.getLength() };
                // Adjust the selection
                if(event.shiftKey) {
                    setCaretRange(isCommand ? { start: caretRange.start, end: lastCaret} : { start: caretRange.start, end: next })
                }
                // Move to the end of the paragraph
                else if(isCommand) {
                    setCaretRange({ start: lastCaret, end: lastCaret});
                }
                // Move the caret
                else {
                    setCaretRange({ start: next, end: next })    
                }
            }
            return;
        }
        // Move the caret left!
        else if(event.key === "ArrowLeft") {
            event.preventDefault();
            if(caretRange.start.node instanceof TextNode && caretRange.end.node instanceof TextNode) {
                // Adjust the selection
                const previous = event.altKey ? caretRange.end.node.previousWord(caretRange.end.index) : caretRange.end.node.previous(caretRange.end.index);
                const paragraph = caretRange.start.node.getParagraph();
                const first = paragraph.getFirstTextNode();
                const firstCaret = { node: first, index: 0 };
                if(event.shiftKey) {
                    setCaretRange(isCommand ? { start: caretRange.start, end: firstCaret } : { start: caretRange.start, end: previous });
                }
                // Move to the beginning of the paragraph
                else if(isCommand) {
                    setCaretRange({ start: firstCaret, end: firstCaret});
                }
                else {
                    setCaretRange({ start: previous, end: previous })    
                }
            }
            return;
        }
        // Move the caret up!
        else if(event.key === "ArrowUp") {
            event.preventDefault();
            if(caretRange.start.node instanceof TextNode && caretRange.end.node instanceof TextNode) {
                if(event.shiftKey) {
                    setCaretRange({ start: caretRange.start, end: getCaretAbove(caretRange.end) });
                }
                else {
                    const above = getCaretAbove(caretRange.start);
                    setCaretRange({ start: above, end: above });
                }
            }
        }
        // Move the caret down!
        else if(event.key === "ArrowDown") {
            event.preventDefault();
            if(caretRange.start.node instanceof TextNode && caretRange.end.node instanceof TextNode) {

                // If this is a text node in a link, enter the link form.
                const atom = caretRange.start.node.getClosestParentMatching(p => p instanceof LinkNode || p instanceof InlineCodeNode);
                if(atom) {
                    setCaretRange({ start: { node: atom, index: 0 }, end: { node: atom, index: 0 }});
                }
                else if(event.shiftKey)
                    setCaretRange({ start: caretRange.start, end: getCaretBelow(caretRange.end) });
                else {
                    const below = getCaretBelow(caretRange.start);
                    setCaretRange({ start: below, end: below });
                }
            }
        }
        // Backspace over a character!
        else if(event.key === "Backspace") {
            event.preventDefault();
            const caret = (ast.deleteSelection(caretRange, true));
            setCaretRange({ start: caret, end: caret });
            return;
        }
        // Delete forward a character!
        else if(event.key === "Delete") {
            event.preventDefault();
            const caret = ast.deleteSelection(caretRange, false);
            setCaretRange({ start: caret, end: caret });
            return;
        }
        // Split the current paragraph and place the caret at the beginning of the new one!
        else if(event.key === "Enter") {
            if(caretRange.start.node instanceof TextNode) {
                event.preventDefault();
                const caret = ast.splitSelection(caretRange);
                setCaretRange({ start: caret, end: caret });
                return;
            }
        }
        else if(isCommand) {
            if(event.key === "b") {
                event.preventDefault();
                setCaretRange(ast.formatSelection(caretRange, "*"))
                return;
            }
            else if(event.key === "i") {
                event.preventDefault();
                setCaretRange(ast.formatSelection(caretRange, "_"))
                return;
            }
            else if(event.key === ",") {
                event.preventDefault();
                setCaretRange(ast.formatSelection(caretRange, "v"))
                return;
            }
            else if(event.key === ".") {
                event.preventDefault();
                setCaretRange(ast.formatSelection(caretRange, "^"))
                return;
            }
            else if(event.key === "0") {
                event.preventDefault();
                setCaretRange(ast.formatSelection(caretRange, ""));
                return;
            }
            else if(event.key === "k") {
                event.preventDefault();
                const caret = ast.toggleAtom(caretRange, LinkNode, (parent, text) => new LinkNode(parent, text));
                if(caret)
                    setCaretRange({ start: caret, end: caret});
                return;
            }
            else if(event.key === "j") {
                event.preventDefault();
                const caret = ast.toggleAtom(caretRange, InlineCodeNode, (parent, text) => new InlineCodeNode(parent, text));
                if(caret)
                    setCaretRange({ start: caret, end: caret});
            }
        }
        
        // Insert any non control character! This is a bit hacky: all but "Fn" are more than three characters.
        if(!isCommand && event.key.length == 1) {
            event.preventDefault()
            const caret = ast.insertSelection(event.key, caretRange);
            setCaretRange({ start: caret, end: caret });
            return;
        }

    }

    function handleMouseDown(event: React.MouseEvent) {
        
        if(!editorRef.current)
            return;

        // Grab focus.
        editorRef.current.focus();

        // If we've selected a non-TextNode, release it, so the browser is free to select a text node.
        if(caretRange && !(caretRange.start.node instanceof TextNode)) {
            setCaretRange(undefined);
        }

    }

    function onFocus(event: React.FocusEvent) {
    }

    function onBlur(event: React.FocusEvent) {
        
        // If the editor lost focus and the caret was on a text node, erase the caret.
        // Otherwise, we leave it alone, since children of this editor may focus and blur.
        if(editorRef.current && event.target === editorRef.current && caretRange?.start.node instanceof TextNode) {
            setCaretRange(undefined);
        }
    }

    function handleKeyUp(event: React.KeyboardEvent) {
        event.preventDefault();
    }

    const isSelection = caretRange && (caretRange.start.node !== caretRange.end.node || caretRange.start.index !== caretRange.end.index);
    const isItalic = caretRange && !isSelection && caretRange.start.node instanceof TextNode && caretRange.start.node.isItalic();
    const isBold = caretRange && !isSelection && caretRange.start.node instanceof TextNode && caretRange.start.node.isBold();
    const isLink = caretRange && !isSelection && caretRange.start.node.getClosestParentMatching(p => p instanceof LinkNode) !== undefined;

    return <CaretContext.Provider value={{ selection: caretRange, rect: caretRect, setCaretRange: setCaretRange }}>
            <div 
                className="bookish-chapter-editor"
                ref={editorRef}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onMouseDown={handleMouseDown}
                onFocus={onFocus}
                onBlur={onBlur}
                tabIndex={0} // Makes the editor focusable.
                >
                {
                    // Draw a caret. We draw our own since this view isn't contentEditable and we can't show a caret.
                    // Customize the rendering based on the formatting applied to the text node.
                    caretRect && caretRange && !isSelection ? 
                        <div 
                            className={`bookish-chapter-editor-caret ${isLink ? "bookish-chapter-editor-caret-linked" : isItalic ? "bookish-chapter-editor-caret-italic" :""} ${isBold ? "bookish-chapter-editor-caret-bold" : ""} ${idle ? "bookish-chapter-editor-caret-blink" : ""}`}
                            style={{
                                left: caretRect.x,
                                top: caretRect.y
                            }}>
                        </div> : null
                }                
                { renderNode(props.ast) }
            </div>
        </CaretContext.Provider>
    ;
}

export default ChapterEditor