import { Node } from "./Node";
import { AtomNode } from "./AtomNode";
import { TextNode } from "./TextNode";

export type Caret = { node: TextNode | AtomNode<any>; index: number; };
export type CaretRange = { start: Caret; end: Caret; };
export type IndexRange = { start: number, end: number };

export function getTextAndAtomNodes(node: Node): (AtomNode<any>|TextNode)[] {
    return node.getNodes().filter(n => n instanceof TextNode || n instanceof AtomNode) as (AtomNode<any>|TextNode)[];
}

export function caretToIndex(node: Node, caret: Caret): number | undefined {

    const nodes = getTextAndAtomNodes(node);
    let index = 0;
    for(let i = 0; i < nodes.length; i++) {
        const t = nodes[i];
        if(t !== caret.node)
            index += t.getCaretPositionCount();
        else
            return index + caret.index;
    }
    return undefined;

}

export function indexToCaret(node: Node, index: number): Caret | undefined {

    const nodes = getTextAndAtomNodes(node);
    let currentIndex = 0;
    for(let i = 0; i < nodes.length; i++) {
        const t = nodes[i];
        if(index >= currentIndex && index <= currentIndex + t.getCaretPositionCount()) {
            // Prefer empty nodes to enable zero width formats.
            if(i < nodes.length - 1) {
                const next = nodes[i + 1];
                if(next instanceof TextNode && next.getLength() === 0) 
                    return { node: next, index: 0 }
            }
            return { node: t, index: index - currentIndex };
        }
        currentIndex += t.getCaretPositionCount();
    }
    return undefined;

}

export function caretRangeToIndexRange(node: Node, range: CaretRange): IndexRange | undefined {
    const startIndex = caretToIndex(node, range.start);
    const endIndex = caretToIndex(node, range.end);
    if(startIndex === undefined || endIndex === undefined) return;
    return { start: startIndex, end: endIndex };
}

export function indexRangeToCaretRange(node: Node, range: IndexRange): CaretRange | undefined {
    const start = indexToCaret(node, range.start);
    const end = indexToCaret(node, range.end);
    if(start === undefined || end === undefined) return;
    return { start: start, end: end }; 
}
