// A global node ID generator, for mapping views back to models.
let nodeID = 1;

export abstract class Node {

    readonly nodeID: number;

    constructor() {
        this.nodeID = nodeID++;
    }

    abstract toText(): string;
    abstract toBookdown(debug?: number): string;
    abstract getType(): string;
    abstract traverseChildren(fn: (node: Node) => void) : void;
    abstract copy(): Node;

    // Returns a new node with the given child node replaced, or undefined if it didn't contain such a child.
    abstract withChildReplaced(node: Node, replacement: Node | undefined): Node | undefined;

    rootWithChildReplaced(root: Node, node: Node, replacement: Node | undefined): Node | undefined {        
        const parent = root.getParentOf(this);
        if(parent === undefined) return;
        const newNode = this.withChildReplaced(node, replacement);
        return parent.rootWithChildReplaced(root, this, newNode === undefined ? this : newNode);
    }

    // In the given root, replaces this with the given node in the given root.
    replace(root: Node, replacement: Node | undefined): Node | undefined {

        const parent = root.getParentOf(this);
        if(parent === undefined) return;
        return parent.rootWithChildReplaced(root, this, replacement);

    }
    
    getID() { return nodeID; }

    traverse(fn: (node: Node) => void) : void {
        this.traverseChildren(fn);
        fn.call(undefined, this);
    }

    getNodes(): Node[] {
        const nodes: Node[] = [];
        this.traverse(node => nodes.push(node));
        return nodes;
    }

    getIndexOf(node: Node): number | undefined {
        const index = this.getNodes().indexOf(node);
        return index >= 0 ? index : undefined;
    }

    contains(node: Node) {
        let found = false;
        this.traverse(n => { if(n === node) found = true; });
        return found;
    }

    abstract getParentOf(node: Node): Node | undefined;

    getParent(root: Node): Node | undefined { return root.getParentOf(this); }

    hasAncestor(root: Node, node: Node): boolean {

        let parent = root.getParentOf(this);
        while(parent) {
            if(parent === node) return true;
            parent = root.getParentOf(parent);
        }
        return false;

    }

    closestParent<T extends Node>(root: Node, type: Function): T | undefined {

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

}