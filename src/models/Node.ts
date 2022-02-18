import type { ChapterNode } from "./ChapterNode";
import { NodeType } from "./Parser";

export abstract class Node {
    nodeID: number = -1;
    type: NodeType;
    parent: Node | undefined;

    constructor(parent: Node | undefined, type: NodeType) {

        if (typeof type !== "string" || type.length === 0)
            throw new Error("All nodes require a type string.");
        this.type = type;
        this.parent = parent;

        const chapter = this.parent?.getChapter()
        if (chapter)
            chapter.indexNode(this);

    }

    setID(id: number) { this.nodeID = id; }

    getChapter(): ChapterNode | undefined {
        return this.parent?.getChapter()
    }

    abstract toText(): String;

    abstract toBookdown(): String;

    traverse(fn: (node: Node) => void) : void {
        this.traverseChildren(fn);
        fn.call(undefined, this);
    }
    
    abstract traverseChildren(fn: (node: Node) => void) : void;

    abstract copy(parent: Node): Node;

    hasParent(node: Node): boolean {

        let parent = this.parent;
        while(parent) {
            if(parent === node) return true;
            parent = parent.parent;
        }
        return false;

    }

    closestParent<T extends Node>(type: Function): T | undefined {

        let parent = this.parent;
        while(parent) {
            if(parent instanceof type) return parent as T;
            parent = parent.parent;
        }
        return undefined;

    }

    getClosestParentMatching(match: (node: Node) => boolean): Node | undefined {

        let parent = this.parent;
        while(parent) {
            if(match.call(undefined, parent))
                return parent;
            parent = parent.parent;
        }
        return undefined;

    }

    getAncestors() {

        const ancestors = [];
        let parent = this.parent;
        while(parent) {
            ancestors.push(parent);
            parent = parent.parent;
        }
        return ancestors;

    }

    getCommonAncestor(node: Node): Node | undefined {

        const thisParents = this.getAncestors();
        const thatParents = node.getAncestors();

        for(let i = 0; i < thisParents.length; i++) {
            for(let j = 0; j < thatParents.length; j++) {
                if(thisParents[i] === thatParents[j])
                    return thisParents[i];
            }
        }
        return undefined;

    }

    // Ask the parent to remove this, if there is one.
    remove() : void { 
        this.getChapter()?.unindexNode(this);
        this.parent?.removeChild(this);
    }

    // Each node has its own way of removing a child.
    abstract removeChild(node: Node): void;

    // Each node has its own way of replacing a child.
    abstract replaceChild(node: Node, replacement: Node): void;

    replaceWith(replacement: Node): void {
        this.parent?.replaceChild(this, replacement);
        this.getChapter()?.unindexNode(this);
    }

    getNodes(): Node[] {
        const nodes: Node[] = [];
        this.traverse(node => nodes.push(node));
        return nodes;
    }

    getSibling(next: boolean) { return this.parent?.getSiblingOf(this, next); }

    abstract getSiblingOf(child: Node, next: boolean): Node | undefined;

    // Delete nodes if they're empty.
    abstract clean(): void;

}