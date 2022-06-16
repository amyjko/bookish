import { Node } from "./Node";
import { BlockNode } from "./BlockNode";
import { ListNode } from "./ListNode";
import { BlockParentNode } from "./BlockParentNode";

export abstract class BlocksNode<T extends (BlockParentNode | undefined)> extends BlockNode<T> {
    
    readonly blocks: BlockNode<T>[];

    constructor(elements: BlockNode<T>[]) {
        super();
        this.blocks = elements;
    }

    getBlocks() { return this.blocks; }

    indexOf(block: BlockNode<T>): number | undefined {
        const index = this.blocks.indexOf(block);
        return index < 0 ? undefined : index;
    }

    contains(block: BlockNode<T>) { return this.indexOf(block) !== undefined; }

    getBlockBefore(anchor: BlockNode<T>): BlockNode<T> | undefined {
        const index = this.blocks.indexOf(anchor);
        if(index <= 0)
            return undefined;
        return this.blocks[index - 1];        
    }

    getBlockAfter(anchor: BlockNode<T>): BlockNode<T> | undefined {
        const index = this.blocks.indexOf(anchor);
        if(index < 0 || index > this.blocks.length - 2)
            return undefined;
        return this.blocks[index + 1];
    }

    getBlocksBetween(first: BlockNode<T>, last: BlockNode<T>): BlockNode<T>[] | undefined {

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

    getParentOf(node: Node): Node | undefined {
        return this.blocks.map(b => b === node ? this : b.getParentOf(node)).find(b => b !== undefined);
    }

    withBlockInserted(anchor: BlockNode<T>, block: BlockNode<T>, before: boolean): BlocksNode<T> | undefined {
        const index = this.blocks.indexOf(anchor);
        if(index < 0)
            return;
        const newBlocks = this.blocks.slice(0).splice(index + (before ? 0 : 1), 0, block);
        return this.create(newBlocks);
    }

    withoutBlock(block: BlockNode<T>): BlocksNode<any> {
        return this.create(this.blocks.filter(n => n === block));
    }

    withBlockInsertedBefore(anchor: BlockNode<T>, block: BlockNode<T>) {
        return this.withBlockInserted(anchor, block, true);
    }

    withBlockInsertedAfter(anchor: BlockNode<T>, block: BlockNode<T>) {
        return this.withBlockInserted(anchor, block, false);
    }

    withMergedAdjacentLists(): BlocksNode<T> {

        const newBlocks: BlockNode<T>[] = [];
        this.blocks.forEach(block => {
            const previousBlock = newBlocks[newBlocks.length - 1];
            // Are these two adjacent lists of the same style? Put all of the current block's list items in the previous block.
            if(previousBlock instanceof ListNode && block instanceof ListNode && previousBlock.isNumbered() === block.isNumbered())
                newBlocks[newBlocks.length - 1] = previousBlock.withListAppended(block) as BlockNode<T>;
            else
                newBlocks.push(block);
        });
    
        return this.create(newBlocks);
    
    }
    
    abstract create(blocks: BlockNode<T>[]): BlocksNode<T>;

}