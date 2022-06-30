import { CaretRange } from "./Caret";
import { Node } from "./Node";

export class ReferenceNode extends Node {

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

    getChildren() { return [] }
 
    getParentOf(node: Node): Node | undefined { return undefined; }

    getUniqueID(ids: string[]): string {
        // Split the authors, combine the first initials of each, then append the year.
        const semicolons = this.authors.includes(";");
        const authors = this.authors.split(semicolons ? /;\s+/ : /,\s+/).map(t => t.trim());
        const initials = authors.map(a => a.charAt(0).toLocaleLowerCase());
        const id = initials.join("") + this.year;
        let revisedID = id;
        let letters = "abcdefghijklmnopqrstuv".split("");
        while(ids.includes(revisedID)) {
            const letter = letters.shift();
            revisedID = id + (letter !== undefined ? letter : Math.floor(Math.random() * 10));
        }
        return revisedID;
    }
    
    toText() { return this.authors + " "  + this.year + " " + this.title + " " + this.source + (this.summary ? this.summary : ""); }
    toBookdown(debug?: number): string { return ""; }
    toList() { 
        const list = [ this.authors, this.year, this.title, this.source ];
        if(this.url) list.push(this.url);
        if(this.summary) list.push(this.summary);
        return list;
    }

    copy() {
        return new ReferenceNode(this.authors, this.year, this.title, this.source, this.url, this.summary, this.short) as this;
    }

    withChildReplaced(node: Node, replacement: Node | undefined) { return undefined; }

    withContentInRange(range: CaretRange): this | undefined { return this.copy(); }

}
