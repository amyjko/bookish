import { Node } from "./Node";

export class ReferenceNode extends Node<Node<any> | undefined> {

    authors: string;
    year: string;
    title: string;
    source: string;
    url: string | null;
    summary: string | null;
    short: boolean;

    constructor(authors: string, year: string, title: string, source: string, url: string | null, summary: string | null, short: boolean) {
        super();
        this.authors = authors;
        this.year = year;
        this.title = title;
        this.source = source;
        this.url = url;
        this.summary = summary;
        this.short = short;
    }

    getType() { return "reference"; }

    traverseChildren(fn: (node: Node) => void): void {}
 
    getParentOf(node: Node): Node | undefined { return undefined; }
    
    toText() { return this.authors + " "  + this.year + " " + this.title + " " + this.source + (this.summary ? this.summary : ""); }
    toBookdown(parent: Node, debug?: number): string {
        return "";
    }

    withChildReplaced(node: Node, replacement: Node | undefined) { return undefined; }

    copy(): ReferenceNode {
        return new ReferenceNode(this.authors, this.year, this.title, this.source, this.url, this.summary, this.short);
    }

}
