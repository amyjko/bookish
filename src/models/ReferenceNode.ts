import { CaretRange } from "./Caret";
import { Node } from "./Node";

export class ReferenceNode extends Node {

    readonly citationID: string;
    readonly authors: string;
    readonly year: string;
    readonly title: string;
    readonly source: string;
    readonly url: string;
    readonly summary: string;
    readonly short: boolean;

    constructor(citationID: string, authors: string="", year: string="", title: string="", source: string="", url: string="", summary: string="", short: boolean=false) {
        super();

        this.citationID = citationID;
        this.authors = authors;
        this.year = year;
        this.title = title;
        this.source = source;
        this.url = url;
        this.summary = summary;
        this.short = short;

    }

    getType() { return "reference"; }

    getChildren() { return [] }
 
    getParentOf(node: Node): Node | undefined { return undefined; }
    
    toText() { return this.authors + " "  + this.year + " " + this.title + " " + this.source + (this.summary ? this.summary : ""); }
    toBookdown(): string { return ""; }
    toList() { 
        const list = [ this.authors, this.year, this.title, this.source ];
        if(this.url) list.push(this.url);
        if(this.summary) list.push(this.summary);
        return list;
    }

    copy() {
        return new ReferenceNode(this.citationID, this.authors, this.year, this.title, this.source, this.url, this.summary, this.short) as this;
    }

    withChildReplaced(node: Node, replacement: Node | undefined) { return undefined; }

    withContentInRange(range: CaretRange): this | undefined { return this.copy(); }

    withCitationID(id: string) { return new ReferenceNode(id, this.authors, this.year, this.title, this.source, this.url, this.summary, this.short); }
    withAuthors(authors: string) { return new ReferenceNode(this.citationID, authors, this.year, this.title, this.source, this.url, this.summary, this.short); }
    withYear(year: string) { return new ReferenceNode(this.citationID, this.authors, year, this.title, this.source, this.url, this.summary, this.short); }
    withTitle(title: string) { return new ReferenceNode(this.citationID, this.authors, this.year, title, this.source, this.url, this.summary, this.short); }
    withSource(source: string) { return new ReferenceNode(this.citationID, this.authors, this.year, this.title, source, this.url, this.summary, this.short); }
    withURL(url: string) { return new ReferenceNode(this.citationID, this.authors, this.year, this.title, this.source, url, this.summary, this.short); }
    withSummary(summary: string) { return new ReferenceNode(this.citationID, this.authors, this.year, this.title, this.source, this.url, summary, this.short); }

}
