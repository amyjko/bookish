import { ChapterNode } from "./ChapterNode";
import { NodeType } from "./Parser";


export abstract class Node {
    nodeID: number | undefined;
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

    toText() {
        throw new Error("Method not implemented.");
    }

    traverse(fn: (node: Node) => void) : void {
        this.traverseChildren(fn);
        fn.call(undefined, this);
    }
    
    abstract traverseChildren(fn: (node: Node) => void) : void;

    hasParent(node: Node): boolean {

        let parent = this.parent;
        while(parent) {
            if(parent === node) return true;
            parent = parent.parent;
        }
        return false;

    }

    // Ask the parent to remove this, if there is one.
    remove() { 
        this.getChapter()?.unindexNode(this)
        this.parent?.removeChild(this) 
    }

    // Each node has its own way of removing a child.
    abstract removeChild(node: Node): void;

}
