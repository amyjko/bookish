import React, { useEffect, useRef, useState } from "react"
import { CaretPosition, ChapterNode, Selection } from "../../models/ChapterNode";
import { renderNode } from "../chapter/Renderer";

const ChapterEditor = (props: { ast: ChapterNode }) => {

    const { ast } = props
    const ref = useRef<HTMLDivElement>(null)
    const [ caret, setCaret ] = useState<CaretPosition | [ CaretPosition, CaretPosition ] | undefined>()

    function getTextNode(node: Element) {
        // Find the text node in the given match.
        let text: Node = node
        for (let i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeType === Node.TEXT_NODE) {
                text = node.childNodes[i];
                break;
            }
        }
        return text;
    }

    function validatePosition(node: Node, index: number): boolean {
        // Some assertions, just in case some defects slip through.
        if(node && node.nodeType === Node.TEXT_NODE && node.nodeValue) {
            if(index < 0 || index > node.nodeValue.length) {
                console.error(`Somehow, the caret we're setting on "${node.nodeValue}" and the index is ${index}`)
                return false;
            }
        }        
        return true;
    }

    // When the caret state changes, update the selection correspondingly.
    useEffect(() => {

        if(caret) {

            const start = Array.isArray(caret) ? caret[0] : caret;
            const end = Array.isArray(caret) ? caret[1] : undefined;

            const startNode = document.querySelector(`[data-nodeid="${start.node}"]`);
            const endNode = end ? document.querySelector(`[data-nodeid="${end.node}"]`) : undefined;

            const selection = window.getSelection();
            
            if(!startNode) { console.error(`Couldn't find node ID ${start.node}`); return; }
            if(end && !endNode) { console.error(`Couldn't find node ID ${end.node}`); return; }
            if(!selection) { console.error(`Couldn't find a window selection.`); return; }

            // Find the text node in the given match.
            const startTextNode = getTextNode(startNode);
            const endTextNode = endNode ? getTextNode(endNode) : undefined;

            // Some assertions, just in case some defects slip through.
            if(!validatePosition(startTextNode, start.index)) return;
            if(end && endTextNode && !validatePosition(endTextNode, end.index)) return;

            const range = document.createRange()
            range.setStart(startTextNode, start.index)
            // Set a selection if we were given one.
            range.setEnd(endTextNode ? endTextNode: startTextNode, end ? end.index : start.index)
            selection.removeAllRanges()
            selection.addRange(range)

        }

        // Restore the visibility of the caret now that it's positioned.
        if(ref.current)
            ref.current.style.removeProperty("caret-color")

    }, [ caret ])

    function updateCaret(position: CaretPosition | [ CaretPosition, CaretPosition ] | undefined) {
        // Hide the caret to avoid flickering until the redraw is done.
        // Update the position.
        if(position) {
            if(ref.current)
                ref.current.style.caretColor = "transparent";
            setCaret(position);
        }
    }

    // Given an HTML node, find the corresponding AST node.
    function getNodeID(el: Node) {

        let element: HTMLElement | null = null
        if(el.nodeType === Node.ELEMENT_NODE) {
            element = el as HTMLElement
            if(element.dataset.nodeid !== undefined)
                return parseInt(element.dataset.nodeid)
        } else {
            element = el.parentElement;
        }

        // If we have an element, but it didn't have a node id, search for the closest parent that does.
        if(element !== null)
            element = element.closest("[data-nodeid]")

        // If we found a parent that does, return its node ID.
        if(element !== null && element.dataset.nodeid) {
            return parseInt(element.dataset.nodeid)
        }

        return undefined

    }

    function handleKeyDown(event: React.KeyboardEvent) {

        // console.log(`Pressed down ${event.key}`)

        const selection = window.getSelection()
        let nodeSelection: Selection | undefined = undefined
        if(selection) {
            if(selection.anchorNode && selection.focusNode) {
                const anchor = getNodeID(selection.anchorNode)
                const focus = getNodeID(selection.focusNode)
                if(anchor !== undefined && focus !== undefined)
                    nodeSelection = {
                        startID: anchor,
                        startIndex: selection.anchorOffset,
                        endID: focus,
                        endIndex: selection.focusOffset
                    }
            }
        }

        // No selection? Bubble up the keyboard event.
        if(nodeSelection === undefined) {
            return;
        }
        // Command? Capture the common ones.
        else if(event.metaKey) {
            if(event.key === "b") {
                event.preventDefault();
                updateCaret(ast.formatSelection(nodeSelection, "*"))
                return;
            }
            else if(event.key === "i") {
                event.preventDefault();
                updateCaret(ast.formatSelection(nodeSelection, "_"))
                return;
            }
            else if(event.key === "c") {
                console.log(`Copy`)
                event.preventDefault();
                return;
            }
            else if(event.key === "x") {
                console.log(`Cut`)
                event.preventDefault();
                return;
            }
            else if(event.key === "v") {
                console.log(`Paste`)
                event.preventDefault();
                return;
            }
            else if(event.key === "-") {
                console.log(`Rule`);
                event.preventDefault();
                updateCaret(ast.insertRule(nodeSelection))
            }
            else return;
        } else {
            if(event.key === "Enter") {
                event.preventDefault();
                updateCaret(ast.splitSelection(nodeSelection));
                return;
            }
            else if(event.key === "Tab") {
                console.log(`Tab`)
                event.preventDefault()
                return;
            }
            else if(event.key === "Backspace") {
                event.preventDefault();
                updateCaret(ast.deleteSelection(nodeSelection, true));
                return;
            }
            else if(event.key === "Delete") {
                event.preventDefault();
                updateCaret(ast.deleteSelection(nodeSelection, false));
                return;
            }
            else if(event.key.match(/^[` ~!@#$%^&*(){}\[\];:'",,<>/?\-_=+\\|.a-zA-Z0-9]$/)) {
                event.preventDefault()
                updateCaret(ast.insertSelection(event.key, nodeSelection))
                return;
            }    
        }

        if(event.key)
            switch(event.key) {
                case "Cut":
                    event.preventDefault();
                    return;
                case "Copy":
                    event.preventDefault();
                    return;
                case "Paste":
                    event.preventDefault();
                    return;
                // Let the browser handle everything else
                default:
                    return;
            }

    }

    function handleKeyUp(event: React.KeyboardEvent) {
        event.preventDefault()
    }

    return <div 
        ref={ref}
        contentEditable 
        suppressContentEditableWarning={true}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        spellCheck={false}
        >{
        renderNode(props.ast)
    }</div>;

}

export default ChapterEditor