import React, { useEffect, useRef } from "react"
import { ChapterNode, Selection } from "../../models/ChapterNode";
import { renderNode } from "../chapter/Renderer";

const ChapterEditor = (props: { ast: ChapterNode }) => {

    const { ast } = props
    const ref = useRef(null)
    const [caret, setCaret] = React.useState<{ node: number, index: number} | undefined>()

    // When the caret state changes, update the selection correspondingly.
    useEffect(() => {

        if(!caret)
            return

        const node = document.querySelector(`[data-nodeid="${caret.node}"]`)
        const selection = window.getSelection()
        
        if(!node) { console.error(`Couldn't find node ID ${caret.node}`); return; }
        if(!selection) { console.error(`Couldn't find a window selection.`); return; }

        // Find the text node in the given match.
        let text = undefined
        for (let i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeType === Node.TEXT_NODE) {
                text = node.childNodes[i];
                break;
            }
        }    

        if(text === undefined || !text.nodeValue) { console.error(`Couldn't find a text node in ${caret.node}`); return; }

        if(caret.index < 0 || caret.index > text.nodeValue.length) {
            console.error(`Somehow, the caret we're setting on "${text.nodeValue}" and the index is ${caret.index}`)
            return;
        }

        const range = document.createRange()
        range.setStart(text, caret.index)
        range.setEnd(text, caret.index)
        selection.removeAllRanges()
        selection.addRange(range)

    }, [caret])

    // Given an HTML node, find the corresponding AST node.
    function getNodeID(el: Node) {

        // Find the nearest node with a nodeid.
        let element: HTMLElement | null = null
        if(el.nodeType !== Node.ELEMENT_NODE)
            element = el.parentElement;
        if(element !== null)
            element = element.closest("[data-nodeid]")
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
                if(anchor && focus)
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
            if(event.key === "c") {
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
            else return;
        } else {
            if(event.key === "Enter") {
                console.log(`Enter`)
                event.preventDefault();
                return;
            }
            else if(event.key === "Tab") {
                console.log(`Tab`)
                event.preventDefault();
                return;
            }
            else if(event.key === "Backspace") {
                event.preventDefault();
                setCaret(ast.removeSelection(nodeSelection, false))
                return;
            }
            else if(event.key === "Delete") {
                event.preventDefault();
                setCaret(ast.removeSelection(nodeSelection, true))
                return;
            }
            // Insert text.
            else if(event.key.match(/^[` ~!@#$%^&*(){}\[\];:'",,<>/?\-_=+\\|.a-zA-Z0-9]$/)) {
                event.preventDefault();
                setCaret(ast.insert(event.key, nodeSelection))
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