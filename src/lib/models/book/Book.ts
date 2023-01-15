import type { DocumentReference } from 'firebase/firestore';
import { readEdition } from '../CRUD';
import BookMedia from './BookMedia';
import type Edition from './Edition';

export type EditionInfo = {
    ref: DocumentReference;
    time: number;
    summary: string;
    published: boolean;
};

export type BookSpecification = {
    // All of these are caches from the latest edition, saved when an edition is updated.
    title: string;
    authors: string[];
    description: string;
    cover: string | null;
    // A list of editions
    editions: EditionInfo[];
    // An optional subdomain
    domain?: string;
    // A list of user ids that have access to edit the book.
    uids: string[];
};

export default class Book {
    readonly ref: DocumentReference;
    readonly title: string;
    readonly authors: string[];
    readonly description: string;
    readonly cover: string | null;
    readonly editions: EditionInfo[];
    readonly domain: string | undefined;
    readonly uids: string[];

    media: BookMedia;

    constructor(
        ref: DocumentReference,
        title: string,
        authors: string[],
        description: string,
        cover: string | null,
        revisions: EditionInfo[],
        domain: string | undefined,
        uids: string[]
    ) {
        this.ref = ref;
        this.title = title;
        this.authors = authors;
        this.description = description;
        this.cover = cover;
        this.editions = revisions;
        this.domain = domain;
        this.uids = uids;

        this.media = new BookMedia(this);
    }

    getMedia() {
        return this.media;
    }

    static fromJSON(ref: DocumentReference, book: BookSpecification): Book {
        return new Book(
            ref,
            book.title,
            book.authors,
            book.description,
            book.cover,
            book.editions,
            book.domain,
            book.uids
        );
    }

    toJSON() {
        const json: BookSpecification = {
            title: this.title,
            authors: this.authors,
            description: this.description,
            cover: this.cover,
            editions: this.editions,
            uids: this.uids,
        };
        if (this.domain !== undefined) json.domain = this.domain;
        return json;
    }

    getSubdomain() {
        return this.domain;
    }

    withSubdomain(domain: string) {
        return new Book(
            this.ref,
            this.title,
            this.authors,
            this.description,
            this.cover,
            this.editions,
            domain.length === 0 ? undefined : domain,
            this.uids
        );
    }

    getTitle() {
        return this.title;
    }

    withTitle(title: string) {
        return new Book(
            this.ref,
            title,
            this.authors,
            this.description,
            this.cover,
            this.editions,
            this.domain,
            this.uids
        );
    }

    getDescription() {
        return this.description;
    }

    withDescription(description: string) {
        return new Book(
            this.ref,
            this.title,
            this.authors,
            description,
            this.cover,
            this.editions,
            this.domain,
            this.uids
        );
    }

    getCover() {
        return this.cover;
    }

    withCover(cover: string | null) {
        return new Book(
            this.ref,
            this.title,
            this.authors,
            this.description,
            cover,
            this.editions,
            this.domain,
            this.uids
        );
    }

    getAuthors() {
        return this.authors;
    }

    withAuthors(authors: string[]) {
        return new Book(
            this.ref,
            this.title,
            authors,
            this.description,
            this.cover,
            this.editions,
            this.domain,
            this.uids
        );
    }

    getRef() {
        return this.ref;
    }

    getRefID() {
        return this.ref.id;
    }

    getDraftEdition(): undefined | Promise<Edition> {
        return this.editions.length === 0
            ? undefined
            : readEdition(this.editions[0].ref.id);
    }

    isValidEditionNumber(edition: number) {
        return this.getEditionNumber(edition) !== undefined;
    }

    /* Note: editions are numbered 1-n, but stored in reverse chronological order. */
    getEditionNumber(number: number) {
        return number < 1 || number > this.editions.length
            ? undefined
            : readEdition(this.editions[this.editions.length - number].ref.id);
    }

    getLatestPublishedEdition(): undefined | Promise<Edition> {
        const latest = this.getLatestPublishedEditionID();
        return latest === undefined ? undefined : readEdition(latest);
    }

    getLatestPublishedEditionID() {
        return this.editions.find((e) => e.published)?.ref.id;
    }

    getLatestEditionID(): string | undefined {
        return this.editions[0]?.ref.id;
    }

    getEditions() {
        return this.editions.slice();
    }

    getPublishedEditionCount() {
        return this.editions.filter((edition) => edition.published).length;
    }

    withRevisions(revisions: EditionInfo[]) {
        return new Book(
            this.ref,
            this.title,
            this.authors,
            this.description,
            this.cover,
            revisions,
            this.domain,
            this.uids
        );
    }

    withEditionSummary(summary: string, index: number) {
        if (index < 0 || index >= this.editions.length) return this;
        const revision = this.editions[index];
        return this.withRevisions([
            ...this.editions.slice(0, index),
            {
                ref: revision.ref,
                time: revision.time,
                summary,
                published: revision.published,
            },
            ...this.editions.slice(index + 1),
        ]);
    }

    withEditionAsPublished(published: boolean, editionNumber: number) {
        if (editionNumber < 0 || editionNumber >= this.editions.length)
            return this;
        const revision = this.editions[editionNumber];
        return this.withRevisions([
            ...this.editions.slice(0, editionNumber),
            {
                ref: revision.ref,
                time: revision.time,
                summary: revision.summary,
                published,
            },
            ...this.editions.slice(editionNumber + 1),
        ]);
    }

    hasPublishedEdition() {
        return (
            this.editions.find((revision) => revision.published) !== undefined
        );
    }
}
