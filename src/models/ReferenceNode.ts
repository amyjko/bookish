import { ChapterNode } from "./ChapterNode";
import { Node } from "./Node";


export class ReferenceNode extends Node {
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

}
