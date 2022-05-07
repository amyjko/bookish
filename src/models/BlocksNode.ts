import { Caret } from "./Caret";
import { Node } from "./Node";
import { BlockNode } from "./BlockNode";
import { BlockParentNode } from "./BlockParentNode";
import { NodeType } from "./NodeType";
import { ListNode } from "./ListNode";

export abstract class BlocksNode extends Node {
    
    blocks: BlockNode[];

    constructor(parent: BlockParentNode | undefined, elements: BlockNode[], type: NodeType) {
        super(parent, type);
        this.blocks = elements;
    }

    getBlocks() { return this.blocks; }

    removeChild(node: Node): void {
        this.blocks = this.blocks.filter(item => item !== node)
    }

    replaceChild(node: Node, replacement: BlockNode): void {
        const index = this.blocks.indexOf(node as BlockNode);
        if(index < 0) return;
        this.blocks[index] = replacement;
    }

    insertAfter(anchor: BlockNode, block: BlockNode) {
        this.insert(anchor, block, false);
    }

    insertBefore(anchor: BlockNode, block: BlockNode) {
        this.insert(anchor, block, true);
    }

    indexOf(block: BlockNode): number | undefined {
        const index = this.blocks.indexOf(block);
        return index < 0 ? undefined : index;
    }

    insert(anchor: BlockNode, block: BlockNode, before: boolean) {
        const index = this.blocks.indexOf(anchor);
        if(index < 0)
            return;
        this.blocks.splice(index + (before ? 0 : 1), 0, block);
    }

    getBlockBefore(anchor: BlockNode): BlockNode | undefined {
        const index = this.blocks.indexOf(anchor);
        if(index <= 0)
            return undefined;
        return this.blocks[index - 1];        
    }

    getBlockAfter(anchor: BlockNode): BlockNode | undefined {
        const index = this.blocks.indexOf(anchor);
        if(index < 0 || index > this.blocks.length - 2)
            return undefined;
        return this.blocks[index + 1];
    }

    getBlocksBetween(first: BlockNode, last: BlockNode): BlockNode[] | undefined {

        const firstIndex = this.indexOf(first);
        const lastIndex = this.indexOf(last);
        if(firstIndex !== undefined && lastIndex !== undefined) {
            // Swap to be in order.
            if(firstIndex > lastIndex) {
                const temp = first;
                first = last;
                last = temp;
            }
            const blocks = [];
            let inside = false;
            for(let i = 0; i < this.blocks.length; i++) {
                let block = this.blocks[i];
                if(block === first)
                    inside = true;
                if(inside)
                    blocks.push(block);
                if(block === last)
                    break;
            }
            return blocks;
        }
        return undefined;

    }

    append(block: BlockNode) {
        this.blocks.push(block);
    }

    clean() {
        if(this.blocks.length === 0) this.remove()
    }

}
