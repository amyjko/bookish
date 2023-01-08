export default class Reference {
    readonly citationID: string;
    readonly authors: string;
    readonly year: string;
    readonly title: string;
    readonly source: string;
    readonly url: string;
    readonly summary: string;
    readonly short: boolean;

    constructor(
        citationID: string,
        authors: string = '',
        year: string = '',
        title: string = '',
        source: string = '',
        url: string = '',
        summary: string = '',
        short: boolean = false
    ) {
        this.citationID = citationID;
        this.authors = authors;
        this.year = year;
        this.title = title;
        this.source = source;
        this.url = url;
        this.summary = summary;
        this.short = short;
    }

    toText() {
        return (
            this.authors +
            ' ' +
            this.year +
            ' ' +
            this.title +
            ' ' +
            this.source +
            (this.summary ? this.summary : '')
        );
    }

    toList() {
        return [
            this.authors,
            this.year,
            this.title,
            this.source,
            this.url,
            this.summary,
        ];
    }

    copy() {
        return new Reference(
            this.citationID,
            this.authors,
            this.year,
            this.title,
            this.source,
            this.url,
            this.summary,
            this.short
        ) as this;
    }

    withChildReplaced() {
        return undefined;
    }

    withContentInRange(): this | undefined {
        return this.copy();
    }

    withCitationID(id: string) {
        return new Reference(
            id,
            this.authors,
            this.year,
            this.title,
            this.source,
            this.url,
            this.summary,
            this.short
        );
    }
    withAuthors(authors: string) {
        return new Reference(
            this.citationID,
            authors,
            this.year,
            this.title,
            this.source,
            this.url,
            this.summary,
            this.short
        );
    }
    withYear(year: string) {
        return new Reference(
            this.citationID,
            this.authors,
            year,
            this.title,
            this.source,
            this.url,
            this.summary,
            this.short
        );
    }
    withTitle(title: string) {
        return new Reference(
            this.citationID,
            this.authors,
            this.year,
            title,
            this.source,
            this.url,
            this.summary,
            this.short
        );
    }
    withSource(source: string) {
        return new Reference(
            this.citationID,
            this.authors,
            this.year,
            this.title,
            source,
            this.url,
            this.summary,
            this.short
        );
    }
    withURL(url: string) {
        return new Reference(
            this.citationID,
            this.authors,
            this.year,
            this.title,
            this.source,
            url,
            this.summary,
            this.short
        );
    }
    withSummary(summary: string) {
        return new Reference(
            this.citationID,
            this.authors,
            this.year,
            this.title,
            this.source,
            this.url,
            summary,
            this.short
        );
    }
}
