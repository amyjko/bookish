import { FormatNode } from "./FormatNode";
import { Node } from "./Node";

export abstract class BlockNode extends Node {

    abstract getFormats(): FormatNode[];
    abstract copy(): BlockNode;
    abstract withChildReplaced(node: Node, replacement: Node): BlockNode | undefined;

}