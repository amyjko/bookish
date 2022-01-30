import { Node } from "./Node";

export class TextNode extends Node {
    text: string;
    position: number;
    constructor(parent: Node, text: string, position: number) {
        super(parent, "text");
        this.text = text;
        this.position = position - text.length;
    }

    insert(char: string, index: number) {
        if (this.nodeID) {
            this.text = this.text.slice(0, index) + char + this.text.slice(index);
            return {
                node: this.nodeID,
                index: index + 1
            };
        } else
            return undefined;
    }

    removeRange(index: number, count: number, forward: boolean): { node: number, index: number } | undefined {
        if (this.nodeID) {
            // If we're deleting backwards and we haven't been asked to delete before the first character, delete!
            if (!forward) {
                // If this is anywhere after the first index, just adjust the text and return the new caret position.
                if(index - count >= 0) {
                    this.text = this.text.slice(0, index - count) + this.text.slice(index);
                    if(this.text.length > 0)
                    return {
                        node: this.nodeID,
                        index: index - count
                    }
                }
                // Otherwise, delegate this to the previous text node.
                else {
                    const previousText = this.previousText()
                    if(previousText)
                        return previousText.removeRange(previousText.text.length, count, false)
                    // If there isn't any, don't do anything.
                    else 
                        return undefined
                }
            }
            else if (forward) {
                // If were before the end of the string.
                if(index + count <= this.text.length) {
                    this.text = this.text.slice(0, index) + this.text.slice(index + count);
                    if(this.text.length > 0) {
                        // Don't move the position, just stay in place.
                        return {
                            node: this.nodeID,
                            index: index
                        }
                    }
                } 
                // Otherwise, delegate to the next text node.
                else {
                    const nextText = this.nextText()
                    if(nextText)
                        return nextText.removeRange(0, count, true)
                    // If there isn't any, don't do anything.
                    else 
                        return undefined
                }
            }

            // If the node is now empty, remove it and return a selection before this deleted node, or after if there is no before.
            if(this.text.length === 0) {
                const previous = this.previousText()
                const next = this.nextText()
                this.remove()
                if(previous && previous.nodeID) {
                    return {
                        node: previous.nodeID,
                        index: previous.text.length
                    }
                }
                if(next && next.nodeID) {
                    return {
                        node: next.nodeID,
                        index: 0
                    }
                }
                return undefined
            }

        } 
        return undefined;
    }

    toText(): string {
        return this.text;
    }

    previousText() {
        const chap = this.getChapter()
        if(chap === undefined) return undefined;

        const text = chap.getTextNodes()
        const index = text.indexOf(this)
        // If we didn't find it or this is the first text node, there is no previous text node.
        return index < 1 ? undefined : text[index - 1];
    }

    nextText() {
        const chap = this.getChapter()
        if(chap === undefined) return undefined;

        const text = chap.getTextNodes()
        const index = text.indexOf(this)
        // If we didn't find it or this is the first text node, there is no previous text node.
        return index < 0 || index === text.length - 1 ? undefined : text[index + 1];
    }

    traverseChildren(fn: (node: Node) => void): void {}
    removeChild(node: Node): void {}

}
