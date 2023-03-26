import Parser from '../chapter/Parser';
import type ChapterNode from '../chapter/ChapterNode';
import type Edition from './Edition';
import type { DocumentReference } from 'firebase/firestore';
import CommonWords from './Words';

export type ChapterSpecification = {
    ref?: DocumentReference;
    id: string;
    title: string;
    authors: string[];
    image: string | null;
    numbered: boolean;
    forthcoming: boolean;
    section?: string;
    /** A string means that we know the chapter's text; null means we haven't loaded it yet from the database and should not be editing or saving it. */
    text?: string | null;
    uids: string[];
};

export type ChapterContent = {
    text: string;
};

export type Match = {
    left: string;
    match: string;
    right: string;
};

export default class Chapter {
    // Inputs
    readonly ref: DocumentReference | undefined;
    readonly id: string;
    readonly title: string;
    readonly authors: string[];
    readonly image: string | null;
    readonly numbered: boolean;
    readonly forthcoming: boolean;
    readonly section: string | undefined;
    readonly text: string | null;
    readonly uids: string[];

    // Derived values
    _ast: ChapterNode | undefined = undefined;
    _index: Record<string, Array<Match>> | undefined = undefined;
    _wordCount: number | undefined = undefined;

    // A list of requested edits, stored as promises, resolved
    // when the book is ready to save.
    edits: { resolve: Function; reject: Function }[] = [];

    lastEdit: number = 0;

    // A set of listeners that are notified when the chapter text changes.
    listeners = new Set<(text: string) => void>();

    constructor(
        ref: DocumentReference | undefined,
        id: string,
        title: string,
        authors: string[],
        image: string | null,
        numbered: boolean,
        forthcoming: boolean,
        section: string | undefined,
        text: string | null,
        uids: string[]
    ) {
        this.ref = ref;
        this.id = id;
        this.title = title;
        this.authors = authors.slice();
        this.image = image;
        this.numbered = numbered;
        this.forthcoming = forthcoming;
        this.section = section;
        this.text = text;
        this.uids = uids;
    }

    /**
     * Convert a chapter spec and it's text into a chapter object.
     * The spec may contain the text itself, but it may not, so we require it to be
     * repeated here to guarantee its provided.
     */
    static fromJSON(spec: ChapterSpecification) {
        // Copy the spec, filling in defaults as necessary.
        return new Chapter(
            spec.ref,
            spec.id,
            spec.title,
            spec.authors ?? [],
            spec.image ?? null,
            spec.numbered === true || spec.numbered === undefined,
            spec.forthcoming === true,
            spec.section,
            spec.text ?? null,
            spec.uids
        );
    }

    toJSON(): ChapterSpecification {
        // Note that we don't include the chapter text in the payload; that's stored in the chapters subcollection.
        // We just return the chapter metadata here, which is stored in the book collection.
        const json: ChapterSpecification = {
            id: this.id,
            title: this.title,
            authors: this.authors.slice(),
            image: this.image,
            numbered: this.numbered,
            forthcoming: this.forthcoming,
            uids: this.uids,
        };
        if (this.ref) json.ref = this.ref;
        if (this.section) json.section = this.section;
        return json;
    }

    getRef() {
        return this.ref;
    }

    hasRefID(id: string) {
        return this.ref !== undefined && this.ref.id === id;
    }

    withEditors(uids: string[]) {
        return new Chapter(
            this.ref,
            this.id,
            this.title,
            this.authors,
            this.image,
            this.numbered,
            this.forthcoming,
            this.section,
            this.text,
            uids
        );
    }

    withRef(ref: DocumentReference) {
        return new Chapter(
            ref,
            this.id,
            this.title,
            this.authors,
            this.image,
            this.numbered,
            this.forthcoming,
            this.section,
            this.text,
            this.uids
        );
    }

    withoutRef() {
        return new Chapter(
            undefined,
            this.id,
            this.title,
            this.authors,
            this.image,
            this.numbered,
            this.forthcoming,
            this.section,
            this.text,
            this.uids
        );
    }

    getID() {
        return this.id;
    }

    withChapterID(id: string) {
        return new Chapter(
            this.ref,
            id,
            this.title,
            this.authors,
            this.image,
            this.numbered,
            this.forthcoming,
            this.section,
            this.text,
            this.uids
        );
    }

    getSection(): string | undefined {
        return this.section;
    }

    withSection(section: string) {
        return new Chapter(
            this.ref,
            this.id,
            this.title,
            this.authors,
            this.image,
            this.numbered,
            this.forthcoming,
            section,
            this.text,
            this.uids
        );
    }

    isForthcoming() {
        return this.forthcoming;
    }

    asForthcoming(forthcoming: boolean) {
        return new Chapter(
            this.ref,
            this.id,
            this.title,
            this.authors,
            this.image,
            this.numbered,
            forthcoming,
            this.section,
            this.text,
            this.uids
        );
    }

    isNumbered() {
        return this.numbered;
    }

    asNumbered(numbered: boolean) {
        return new Chapter(
            this.ref,
            this.id,
            this.title,
            this.authors,
            this.image,
            numbered,
            this.forthcoming,
            this.section,
            this.text,
            this.uids
        );
    }

    isEditor(uid: string) {
        return this.uids.includes(uid);
    }

    getText() {
        return this.text;
    }

    withText(text: string) {
        return new Chapter(
            this.ref,
            this.id,
            this.title,
            this.authors,
            this.image,
            this.numbered,
            this.forthcoming,
            this.section,
            text,
            this.uids
        );
    }

    withAST(ast: ChapterNode) {
        const newChapter = new Chapter(
            this.ref,
            this.id,
            this.title,
            this.authors,
            this.image,
            this.numbered,
            this.forthcoming,
            this.section,
            ast.toBookdown(),
            this.uids
        );
        newChapter._ast = ast;
        return newChapter;
    }

    getAuthors() {
        return this.authors;
    }

    withAuthor(name: string) {
        return new Chapter(
            this.ref,
            this.id,
            this.title,
            [...this.authors, name],
            this.image,
            this.numbered,
            this.forthcoming,
            this.section,
            this.text,
            this.uids
        );
    }

    withRenamedAuthor(index: number, name: string) {
        if (index < 0 || index >= this.authors.length) return this;
        return new Chapter(
            this.ref,
            this.id,
            this.title,
            [
                ...this.authors.slice(0, index),
                name,
                ...this.authors.slice(index + 1),
            ],
            this.image,
            this.numbered,
            this.forthcoming,
            this.section,
            this.text,
            this.uids
        );
    }

    withoutAuthor(index: number) {
        if (index < 0 || index >= this.authors.length) return this;
        return new Chapter(
            this.ref,
            this.id,
            this.title,
            [...this.authors.slice(0, index), ...this.authors.slice(index + 1)],
            this.image,
            this.numbered,
            this.forthcoming,
            this.section,
            this.text,
            this.uids
        );
    }

    getTitle() {
        return this.title;
    }
    withTitle(title: string) {
        return new Chapter(
            this.ref,
            this.id,
            title,
            this.authors,
            this.image,
            this.numbered,
            this.forthcoming,
            this.section,
            this.text,
            this.uids
        );
    }

    getImage() {
        return this.image;
    }

    withImage(image: string | null) {
        return new Chapter(
            this.ref,
            this.id,
            this.title,
            this.authors,
            image,
            this.numbered,
            this.forthcoming,
            this.section,
            this.text,
            this.uids
        );
    }

    getAST(edition: Edition): ChapterNode | undefined {
        if (this.text === null) return undefined;
        // Compute the cache if necessary
        if (this._ast === undefined)
            this._ast = Parser.parseChapter(edition, this.text);
        return this._ast;
    }

    getWordCount(edition: Edition): number | undefined {
        if (this._wordCount === undefined)
            this._wordCount = this.getAST(edition)
                ?.toText()
                .split(/\s+/).length;
        return this._wordCount;
    }

    // Utility function
    getReadingTime(edition: Edition) {
        const wordCount = this.getWordCount(edition);
        return wordCount === undefined || this.isForthcoming()
            ? undefined
            : Math.max(1, Math.round(wordCount / 150));
    }

    getIndex(edition: Edition): Record<string, Match[]> {
        if (this._index === undefined) {
            const ast = this.getAST(edition);
            if (ast === undefined) return {};

            // Build a list of common words
            let commonWords: Set<string> = new Set();
            CommonWords.forEach((word) => commonWords.add(word));

            // Get all the text in the chapter.
            let text = ast.toText();

            // Split by word boundaries.
            const words = text.split(/\b/);

            // Index the words
            const index: Record<string, Array<Match>> = {};
            words.forEach((word, wordNumber) => {
                // Skip non words. We keep them for search results.
                if (!/[a-zA-Z\u2019]+/.test(word)) return;

                word = word.toLowerCase();

                // Should we include?
                // • It shouldn't be a common word
                // • It shouldn't have an apostrophe
                // • It should be longer than two letters
                // • It shouldn't end in 'ly'
                if (
                    !commonWords.has(word) &&
                    word.indexOf('\u2019') < 0 &&
                    word.length > 2 &&
                    word.substring(word.length - 2, word.length) !== 'ly'
                ) {
                    // If we haven't started a list of occurrences, start one.
                    if (!(word in index)) index[word] = [];

                    let match = {
                        left: words
                            .slice(
                                Math.max(0, wordNumber - 10),
                                Math.max(0, wordNumber - 1) + 1
                            )
                            .join(''),
                        match: words[wordNumber],
                        right: words
                            .slice(
                                Math.min(words.length - 1, wordNumber + 1),
                                Math.min(words.length - 1, wordNumber + 10) + 1
                            )
                            .join(''),
                    };
                    // Add the occurrence, but a lower case canonical version.
                    index[word.toLowerCase()].push(match);
                }
            });

            this._index = index;
        }
        return this._index;
    }

    toString() {
        return `${this.title} by ${this.authors.join(
            ', '
        )}: ${this.text?.substring(0, 32)}}`;
    }
}
