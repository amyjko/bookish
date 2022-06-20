// A global node ID generator, for mapping views back to models.
let nodeID = 1;

export abstract class Node {

    // A globally unique identifier, helpful for mapping things back to nodes.
    readonly nodeID: number;

    constructor() {
        this.nodeID = nodeID++;
    }

    // Returns space-separated text in the string, helpful for searching.
    abstract toText(): string;
    
    // Returns a syntactically valid Bookdown string representing the node.
    abstract toBookdown(debug?: number): string;
    
    // Returns a string represent the type of node this is.
    abstract getType(): string;
    
    // Returns an exact copy of this now.
    abstract copy(): this;
    
    // Returns a new node with the given child node replaced, or undefined if it didn't contain such a child.
    abstract withChildReplaced(node: Node, replacement: Node | undefined): this | undefined;
    
    // Returns an ordered list of the child nodes.
    abstract getChildren(): Node[];

    // Recursively returns the parent of the given node.
    abstract getParentOf(node: Node): Node | undefined;

    getID() { return nodeID; }

    traverse(fn: (node: Node, parents: Node[]) => void, parents?: Node[]) : void {
        const path = parents === undefined ? [ this ] : [ ...parents, this ]
        this.traverseChildren(fn, path);
        fn.call(undefined, this, path);
    }

    // Traverses each of the children of this node.
    traverseChildren(fn: (node: Node, parents: Node[]) => void, parents: Node[]) : void {
        const children = this.getChildren();
        children.forEach(child => child.traverse(fn, parents));
    }

    // Depth first sequence of all nodes in this tree.
    getNodes(): Node[] {
        const nodes: Node[] = [];
        this.traverse(node => nodes.push(node));
        return nodes;
    }

    // An index of the given node in the depth-first traversal of the nodes.
    getIndexOf(node: Node): number | undefined {
        const index = this.getNodes().indexOf(node);
        return index >= 0 ? index : undefined;
    }

    // True if this tree contains the given node.
    contains(node: Node) {
        let found = false;
        this.traverse(n => { if(n === node) found = true; });
        return found;
    }

    getParentsOf(node: Node): Node[] | undefined {
        let parents = undefined;
        this.traverse((n, p) => { if(n === node) parents = p; });
        if(parents === undefined) return;
        const withoutNode = [ ... parents ];
        withoutNode.pop();
        return withoutNode;
    }

    getParent(root: Node): Node | undefined { return root.getParentOf(this); }

    hasAncestor(root: Node, node: Node): boolean {

        let parent = root.getParentOf(this);
        while(parent) {
            if(parent === node) return true;
            parent = root.getParentOf(parent);
        }
        return false;

    }

    getClosestParentOfType<T extends Node>(root: Node, type: Function): T | undefined {

        let parent = root.getParentOf(this);
        while(parent) {
            if(parent instanceof type) return parent as unknown as T;
            parent = root.getParentOf(parent);
        }
        return undefined;

    }

    isInside(root: Node, type: Function) {
        return this.getClosestParentMatching(root, p => p instanceof type) !== undefined;
    }

    getClosestParentMatching(root: Node, match: (node: Node) => boolean): Node | undefined {

        let parent = root.getParentOf(this);
        while(parent) {
            if(match.call(undefined, parent))
                return parent;
            parent = root.getParentOf(parent);
        }
        return undefined;

    }

    getFarthestParentMatching(root: Node, match: (node: Node) => boolean): Node | undefined {

        const matchingParents = this.getAncestors(root).filter(match);
        return matchingParents.length > 0 ? matchingParents[matchingParents.length - 1] : undefined;

    }

    getAncestors(root: Node) {

        const ancestors = [];
        let parent = root.getParentOf(this);
        while(parent) {
            ancestors.push(parent);
            parent = root.getParentOf(parent);
        }
        return ancestors;

    }

    getCommonAncestor(root: Node, node: Node): Node | undefined {

        const thisParents = this.getAncestors(root);
        const thatParents = node.getAncestors(root);

        for(let i = 0; i < thisParents.length; i++) {
            for(let j = 0; j < thatParents.length; j++) {
                if(thisParents[i] === thatParents[j])
                    return thisParents[i];
            }
        }
        return undefined;

    }

    // Traverse this node's children, trying to replace the given node with the replacement node (or nothing, if allowed)
    withNodeReplaced(node: Node, replacement: Node | undefined): this | undefined {

        // Is this the node we're replacing? Return the replacement.
        if(node === this) return replacement as this;

        // Find all the children
        const children = this.getChildren();
        // Search each one for a match.
        for(let i = 0; i < children.length; i++) {
            const child = children[i];
            // If we found the child, return a new version of this node with the child replaced.
            if(child === node)
                return this.withChildReplaced(node, replacement);
            
            // Does this child have it? If so, return a version of this node with the revised child.
            const revisedChild = child.withNodeReplaced(node, replacement);
            if(revisedChild !== undefined)
                return this.withChildReplaced(child, revisedChild);
        }

    }
    
}