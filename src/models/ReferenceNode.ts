import { ChapterNode } from "./ChapterNode";
import { Node } from "./Node";


export class ReferenceNode extends Node<ChapterNode> {
    authors: string;
    year: string;
    title: string;
    source: string;
    url: string | null;
    summary: string | null;
    short: boolean;

    constructor(chapter: ChapterNode | undefined, authors: string, year: string, title: string, source: string, url: string | null, summary: string | null, short: boolean) {
        super(chapter, "reference");
        this.authors = authors;
        this.year = year;
        this.title = title;
        this.source = source;
        this.url = url;
        this.summary = summary;
        this.short = short;
    }

    traverseChildren(fn: (node: Node) => void): void {}

    removeChild(node: Node): void {}
    replaceChild(node: Node, replacement: Node): void {}

    getSiblingOf(child: Node, next: boolean) { return undefined; }

    copy(parent: ChapterNode): ReferenceNode {
        return new ReferenceNode(parent, this.authors, this.year, this.title, this.source, this.url, this.summary, this.short);
    }

    clean() {}
    
    toText() { return this.authors + " "  + this.year + " " + this.title + " " + this.source + (this.summary ? this.summary : ""); }
    toBookdown(): String {
        return "";
    }

}
