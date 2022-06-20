import { FormatNode } from "./FormatNode";
import { Node } from "./Node";

export abstract class BlockNode extends Node {

    abstract getFormats(): FormatNode[];
 
}