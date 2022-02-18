import React, { useEffect, useRef, useState } from "react"
import { ChapterNode, CaretRange } from "../../models/ChapterNode";
import { TextNode } from "../../models/TextNode";
import { renderNode } from "../chapter/Renderer";

export const CaretContext = React.createContext<CaretRange | undefined>(undefined)

const ChapterEditor = (props: { ast: ChapterNode }) => {

    const { ast } = props;
    const ref = useRef<HTMLDivElement>(null);

    const [ selection, setSelection ] = useState<CaretRange>();

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

    function handleKeyDown(event: React.KeyboardEvent) {

        if(selection === undefined)
            return;

        // Move the caret right!
        if(event.key === "ArrowRight") {
            event.preventDefault();
            // What's to the right of the current selection's start?
            if(selection.start.node instanceof TextNode && selection.end.node instanceof TextNode) {
                // Adjust the selection
                const next = event.altKey ? selection.end.node.nextWord(selection.end.index) : selection.end.node.next(selection.end.index);
                if(event.shiftKey) {
                    setSelection({ start: selection.start, end: next })
                }
                // Move the caret
                else {
                    setSelection({ start: next, end: next })    
                }
            }
            return;
        }
        // Move the caret left!
        else if(event.key === "ArrowLeft") {
            event.preventDefault();
            if(selection.start.node instanceof TextNode && selection.end.node instanceof TextNode) {
                // Adjust the selection
                const previous = event.altKey ? selection.end.node.previousWord(selection.end.index) : selection.end.node.previous(selection.end.index);
                if(event.shiftKey) {
                    setSelection({ start: selection.start, end: previous })
                }
                else {
                    setSelection({ start: previous, end: previous })    
                }
            }
            return;
        }
        // Backspace over a character!
        else if(event.key === "Backspace") {
            event.preventDefault();
            const caret = (ast.deleteSelection(selection, true));
            setSelection({ start: caret, end: caret });
            return;
        }
        // Delete forward a character!
        else if(event.key === "Delete") {
            event.preventDefault();
            const caret = ast.deleteSelection(selection, false);
            setSelection({ start: caret, end: caret });
            return;
        }
        // Split the current paragraph and place the caret at the beginning of the new one!
        else if(event.key === "Enter") {
            if(selection.start.node instanceof TextNode) {
                event.preventDefault();
                const caret = ast.splitSelection(selection);
                setSelection({ start: caret, end: caret });
                return;
            }
        }
        if(event.metaKey && event.key === "b") {
            event.preventDefault();
            setSelection(ast.formatSelection(selection, "*"))
            return;
        }
        else if(event.metaKey && event.key === "i") {
            event.preventDefault();
            setSelection(ast.formatSelection(selection, "_"))
            return;
        }
        // Insert a character!
        else if(event.key.match(/^[` ~!@#$%^&*(){}\[\];:'",,<>/?\-_=+\\|.a-zA-Z0-9]$/)) {
            if(!event.metaKey) {
                event.preventDefault()
                const caret = ast.insertSelection(event.key, selection);
                setSelection({ start: caret, end: caret });
                return;
            }
        }

    }

    function handleMouseDown(event: React.MouseEvent) {
        
        if(!ref.current)
            return;

        ref.current.focus();

    }

    function onFocus(event: React.FocusEvent) {

        const text = ast.getTextNodes();
        setSelection({
            start: { node: text[0], index: 0 },
            end: { node: text[0], index: 0 }
        });

    }

    function onBlur(event: React.FocusEvent) {

        setSelection(undefined);

    }

    function handleKeyUp(event: React.KeyboardEvent) {
        event.preventDefault();
    }

    return <CaretContext.Provider value={selection}>
            <div 
                className="bookish-chapter-editor"
                ref={ref}
                // contentEditable 
                // suppressContentEditableWarning={true}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onMouseDown={handleMouseDown}
                onFocus={onFocus}
                onBlur={onBlur}
                // spellCheck={false}
                tabIndex={0}
                >{
                renderNode(props.ast)
            }</div>
        </CaretContext.Provider>
    ;
}

export default ChapterEditor