import { FormatNode } from "./FormatNode";
import { Node } from "./Node";

export abstract class BlockNode<T extends Node<any> | undefined> extends Node<T> {

    abstract getFormats(): FormatNode[];
    abstract copy(): BlockNode<T>;
    abstract withChildReplaced(node: Node, replacement: Node): BlockNode<T> | undefined;

}