import type Node from './Node';
import AtomNode from './AtomNode';
import TextNode from './TextNode';
import FormatNode from './FormatNode';
import type EmbedNode from './EmbedNode';
import LineBreakNode from './LineBreakNode';

export type SelectableNode = TextNode | AtomNode<any> | EmbedNode;
type Caret = { node: SelectableNode; index: number };
export type { Caret as default };

export type CaretRange = { start: Caret; end: Caret };
export type IndexRange = { start: number; end: number };

export function getNavigableNodes(
    node: Node,
): (AtomNode<any> | TextNode | LineBreakNode)[] {
    return node
        .getNodes()
        .filter(
            (n) =>
                n instanceof TextNode ||
                n instanceof AtomNode ||
                n instanceof LineBreakNode,
        ) as (AtomNode<any> | TextNode | LineBreakNode)[];
}

function getFormatRoots(node: Node): FormatNode[] {
    const roots: FormatNode[] = [];
    node.traverse((node, parents) => {
        if (
            node instanceof FormatNode &&
            parents.length > 0 &&
            !(parents[parents.length - 1] instanceof FormatNode)
        )
            roots.push(node);
    });
    return roots;
}

export function caretToIndex(node: Node, caret: Caret): number | undefined {
    let roots: Node[] = getFormatRoots(node);
    if (roots.length === 0) roots = [node];

    let currentIndex = 0;
    for (let n = 0; n < roots.length; n++) {
        const nodes = getNavigableNodes(roots[n]);
        for (let i = 0; i < nodes.length; i++) {
            const t = nodes[i];
            if (t !== caret.node) currentIndex += t.getCaretPositionCount();
            else return currentIndex + caret.index;
        }
        // Include one for the root.
        currentIndex++;
    }
}

export function indexToCaret(node: Node, index: number): Caret | undefined {
    let roots: Node[] = getFormatRoots(node);
    if (roots.length === 0) roots = [node];

    let currentIndex = 0;
    for (let n = 0; n < roots.length; n++) {
        const nodes = getNavigableNodes(roots[n]);
        for (let i = 0; i < nodes.length; i++) {
            let t = nodes[i];
            if (
                index >= currentIndex &&
                index <= currentIndex + t.getCaretPositionCount()
            ) {
                // Prefer empty nodes to enable zero width formats.
                if (i < nodes.length - 1) {
                    const next = nodes[i + 1];
                    if (next instanceof TextNode && next.getLength() === 0)
                        return { node: next, index: 0 };
                }
                // If it's a line break node, find the next non-line break node.
                if (t instanceof LineBreakNode) {
                    while (
                        i < nodes.length &&
                        nodes[i] instanceof LineBreakNode
                    )
                        i++;
                    t = nodes[i];
                    if (i === nodes.length || t instanceof LineBreakNode)
                        return undefined;
                    return { node: t, index: 0 };
                } else return { node: t, index: index - currentIndex };
            }
            currentIndex += t.getCaretPositionCount();
        }
        currentIndex++;
    }
}

export function caretRangeToIndexRange(
    node: Node,
    range: CaretRange,
): IndexRange | undefined {
    const startIndex = caretToIndex(node, range.start);
    const endIndex = caretToIndex(node, range.end);
    if (startIndex === undefined || endIndex === undefined) return;
    return { start: startIndex, end: endIndex };
}

export function indexRangeToCaretRange(
    node: Node,
    range: IndexRange,
): CaretRange | undefined {
    const start = indexToCaret(node, range.start);
    const end = indexToCaret(node, range.end);
    if (start === undefined || end === undefined) return;
    return { start: start, end: end };
}
