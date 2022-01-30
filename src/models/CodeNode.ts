import { ChapterNode } from "./ChapterNode";
import { Node } from "./Node";
import { Position } from "./Parser";
import { ContentNode } from "./ContentNode";
import { CalloutNode } from "./CalloutNode";


export class CodeNode extends Node {
    code: string;
    caption: ContentNode | undefined;
    position: Position;
    language: string;
    executable: boolean;
    constructor(parent: ChapterNode | CalloutNode, code: string, language: string, position: Position) {
        super(parent, "code");

        this.code = code;
        this.position = position;
        this.language = language ? language : "plaintext";
        this.executable = language.charAt(language.length - 1) === "!";

        if (this.executable)
            this.language = this.language.slice(0, -1);

    }

    setCaption(caption : ContentNode) {
        this.caption = caption;
    }

    toText() {
        return "";
    }

    traverseChildren(fn: (node: Node) => void): void {
        this.caption?.traverse(fn)
    }

    removeChild(node: Node): void {}

}
