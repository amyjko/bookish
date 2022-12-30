import type Caret from './Caret';
import type { CaretRange } from './Caret';
import type Edit from './Edit';

// A global node ID generator, for mapping views back to models.
let nodeID = 1;

export default abstract class Node {
    // A globally unique identifier, helpful for mapping things back to nodes.
    readonly nodeID: number;

    constructor() {
        this.nodeID = nodeID++;
    }

    // Returns space-separated text in the string, helpful for searching.
    abstract toText(): string;

    // Returns a syntactically valid Bookdown string representing the node and it's children.
    abstract toBookdown(): string;

    // Returns valid HTML representing the node and it's children.
    abstract toHTML(): string;

    // Returns a string represent the type of node this is.
    abstract getType(): string;

    // Returns an exact copy of this now.
    abstract copy(): this;

    // Returns a new node with the given child node replaced, or undefined if it didn't contain such a child.
    abstract withChildReplaced(
        node: Node,
        replacement: Node | undefined
    ): this | undefined;

    // Returns an ordered list of the child nodes.
    abstract getChildren(): Node[];

    // Recursively returns the parent of the given node.
    abstract getParentOf(node: Node): Node | undefined;

    getID() {
        return this.nodeID;
    }

    traverse(
        fn: (node: Node, parents: Node[]) => void,
        parents?: Node[]
    ): void {
        const path = parents === undefined ? [this] : [...parents, this];
        this.traverseChildren(fn, path);
        fn.call(undefined, this, path);
    }

    // Traverses each of the children of this node.
    traverseChildren(
        fn: (node: Node, parents: Node[]) => void,
        parents: Node[]
    ): void {
        const children = this.getChildren();
        children.forEach((child) => child.traverse(fn, parents));
    }

    // Depth first sequence of all nodes in this tree.
    getNodes(): Node[] {
        const nodes: Node[] = [];
        this.traverse((node) => nodes.push(node));
        return nodes;
    }

    getNodeBefore<Kind extends Node>(
        node: Node,
        matcher: (node: Kind) => boolean
    ): Kind | undefined {
        const nodes = this.getNodes();
        let previous: Kind | undefined = undefined;
        for (const currentNode of nodes) {
            if (currentNode === node) return previous;
            if (matcher(currentNode as Kind)) previous = currentNode as Kind;
        }
        return undefined;
    }

    getNodeAfter<Kind extends Node>(
        node: Node,
        matcher: (node: Kind) => boolean
    ): Kind | undefined {
        const nodes = this.getNodes();
        let found: boolean = false;
        for (const currentNode of nodes) {
            if (found && matcher(currentNode as Kind))
                return currentNode as Kind;
            if (currentNode === node) found = true;
        }
        return undefined;
    }

    // Swap them order if this is two text nodes that are reversed.
    sortRange(range: CaretRange): CaretRange {
        const start = range.start.node;
        const end = range.end.node;

        if (start === end)
            return {
                start: {
                    node: start,
                    index: Math.min(range.start.index, range.end.index),
                },
                end: {
                    node: end,
                    index: Math.max(range.start.index, range.end.index),
                },
            };

        // Find the common ancestor of the two nodes.
        const ancestor = start.getCommonAncestor(this, end);

        if (ancestor === undefined) return range;

        // Where do these text nodes appear in the ancestor's node sequence?
        let startIndex = ancestor.getNodes().indexOf(start);
        let endIndex = ancestor.getNodes().indexOf(end);

        // Defensively verify that we could find the given nodes in the document.
        // If we can't, something is wrong upstream.
        if (startIndex < 0 || endIndex < 0)
            throw Error(`Couldn't find caret range node(s) in this tree.`);

        // If we didn't find them, or the start is before the end, return the given range.
        return startIndex === undefined ||
            endIndex === undefined ||
            startIndex < endIndex
            ? range
            : // If they're the same node, order the index.
            startIndex === endIndex
            ? {
                  start: {
                      node: range.start.node,
                      index: Math.min(range.start.index, range.end.index),
                  },
                  end: {
                      node: range.end.node,
                      index: Math.max(range.start.index, range.end.index),
                  },
              }
            : // Otherwise, swap the caret positions
              { start: range.end, end: range.start };
    }

    getNode(id: number) {
        return this.getNodes().find((n) => n.getID() === id);
    }

    // An index of the given node in the depth-first traversal of the nodes.
    getIndexOf(node: Node): number | undefined {
        const index = this.getNodes().indexOf(node);
        return index >= 0 ? index : undefined;
    }

    // True if this tree contains the given node.
    contains(node: Node) {
        let found = false;
        this.traverse((n) => {
            if (n === node) found = true;
        });
        return found;
    }

    // Returns a list of the given node's parents in this tree, from root to direct parent.
    getParentsOf(node: Node): Node[] | undefined {
        let parents = undefined;
        this.traverse((n, p) => {
            if (n === node) parents = p;
        });
        if (parents === undefined) return;
        const withoutNode = [...parents];
        withoutNode.pop();
        return withoutNode;
    }

    getParent(root: Node): Node | undefined {
        return root.getParentOf(this);
    }

    hasAncestor(root: Node, node: Node): boolean {
        let parent = root.getParentOf(this);
        while (parent) {
            if (parent === node) return true;
            parent = root.getParentOf(parent);
        }
        return false;
    }

    getClosestParentOfType<T extends Node>(
        root: Node,
        type: Function
    ): T | undefined {
        let parent = root.getParentOf(this);
        while (parent) {
            if (parent instanceof type) return parent as unknown as T;
            parent = root.getParentOf(parent);
        }
        return undefined;
    }

    isInside(root: Node, type: Function) {
        return (
            this.getClosestParentMatching(root, (p) => p instanceof type) !==
            undefined
        );
    }

    getClosestParentMatching(
        root: Node,
        match: (node: Node) => boolean
    ): Node | undefined {
        let parent = root.getParentOf(this);
        while (parent) {
            if (match.call(undefined, parent)) return parent;
            parent = root.getParentOf(parent);
        }
        return undefined;
    }

    getFarthestParentMatching(
        root: Node,
        match: (node: Node) => boolean
    ): Node | undefined {
        const matchingParents = this.getAncestors(root).filter(match);
        return matchingParents.length > 0
            ? matchingParents[matchingParents.length - 1]
            : undefined;
    }

    getAncestors(root: Node) {
        const ancestors = [];
        let parent = root.getParentOf(this);
        while (parent) {
            ancestors.push(parent);
            parent = root.getParentOf(parent);
        }
        return ancestors;
    }

    getCommonAncestor(root: Node, node: Node): Node | undefined {
        const thisParents = this.getAncestors(root);
        const thatParents = node.getAncestors(root);

        for (let i = 0; i < thisParents.length; i++) {
            for (let j = 0; j < thatParents.length; j++) {
                if (thisParents[i] === thatParents[j]) return thisParents[i];
            }
        }
        return undefined;
    }

    // Traverse this node's children, trying to replace the given node with the replacement node (or nothing, if allowed)
    withNodeReplaced(
        node: Node,
        replacement: Node | undefined
    ): this | undefined {
        // Is this the node we're replacing? Return the replacement.
        if (node === this) return replacement as this;

        // Find all the children
        const children = this.getChildren();
        // Search each one for a match.
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            // If we found the child, return a new version of this node with the child replaced.
            if (child === node)
                return this.withChildReplaced(node, replacement);

            // Does this child have it? If so, return a version of this node with the revised child.
            const revisedChild = child.withNodeReplaced(node, replacement);
            if (revisedChild !== undefined)
                return this.withChildReplaced(child, revisedChild);
        }
    }

    // Given a range, return either a full copy of the node, or a partial copy if it contains the range.
    // If there's a problem, it returns undefined. Assumes the range is sorted in parse order.
    abstract withContentInRange(range: CaretRange): this | undefined;

    // By default, a node doesn't know how to insert anything into itself. Subclasses
    // are responsible for overriding this if they want to support specific insertions.
    withNodeInserted(caret: Caret, node: Node): Edit {
        caret;
        node;
        return undefined;
    }

    copyRange(range: CaretRange): Node | undefined {
        const sortedRange = this.sortRange(range);
        // Find the common ancestor of the range, then ask it to copy the portion of it selected and produce a node.
        const commonAncestor = sortedRange.start.node.getCommonAncestor(
            this,
            sortedRange.end.node
        );
        if (commonAncestor === undefined) return;
        return commonAncestor.withContentInRange(sortedRange);
    }
}
