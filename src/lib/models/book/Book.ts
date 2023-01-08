import type { DocumentReference } from 'firebase/firestore';
import { readEdition, updateBook } from '../CRUD';
import BookMedia from './BookMedia';
import type Edition from './Edition';

export type Revision = {
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
    revisions: Revision[];
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
    readonly revisions: Revision[];
    readonly domain: string | undefined;
    readonly uids: string[];

    media: BookMedia;

    constructor(
        ref: DocumentReference,
        title: string,
        authors: string[],
        description: string,
        cover: string | null,
        revisions: Revision[],
        domain: string | undefined,
        uids: string[]
    ) {
        this.ref = ref;
        this.title = title;
        this.authors = authors;
        this.description = description;
        this.cover = cover;
        this.revisions = revisions;
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
            book.revisions,
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
            revisions: this.revisions,
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
            this.revisions,
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
            this.revisions,
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
            this.revisions,
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
            this.revisions,
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
            this.revisions,
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
        return this.revisions.length === 0
            ? undefined
            : readEdition(this.revisions[0].ref.id);
    }

    isValidEditionNumber(edition: number) {
        return this.getEditionNumber(edition) !== undefined;
    }

    /* Note: editions are numbered 1-n, but stored in reverse chronological order. */
    getEditionNumber(number: number) {
        return number < 1 || number > this.revisions.length
            ? undefined
            : readEdition(
                  this.revisions[this.revisions.length - number].ref.id
              );
    }

    getLatestPublishedEdition(): undefined | Promise<Edition> {
        const latest = this.getLatestPublishedEditionID();
        return latest === undefined ? undefined : readEdition(latest);
    }

    getLatestPublishedEditionID() {
        return this.revisions.find((e) => e.published)?.ref.id;
    }

    getLatestEditionID(): string | undefined {
        return this.revisions[0]?.ref.id;
    }

    getRevisions() {
        return this.revisions.slice();
    }

    withRevisions(revisions: Revision[]) {
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
        if (index < 0 || index >= this.revisions.length) return this;
        const revision = this.revisions[index];
        return this.withRevisions([
            ...this.revisions.slice(0, index),
            {
                ref: revision.ref,
                time: revision.time,
                summary,
                published: revision.published,
            },
            ...this.revisions.slice(index + 1),
        ]);
    }

    asPublished(published: boolean, index: number) {
        if (index < 0 || index >= this.revisions.length) return this;
        const revision = this.revisions[index];
        return this.withRevisions([
            ...this.revisions.slice(0, index),
            {
                ref: revision.ref,
                time: revision.time,
                summary: revision.summary,
                published,
            },
            ...this.revisions.slice(index + 1),
        ]);
    }

    hasPublishedEdition() {
        return (
            this.revisions.find((revision) => revision.published) !== undefined
        );
    }
}
