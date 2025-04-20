import Chapter from './Chapter';
import type { ChapterSpecification } from './Chapter';
import Parser from '../chapter/Parser';
import EmbedNode from '../chapter/EmbedNode';
import Reference from './Reference';
import type Theme from './Theme';
import type Definition from './Definition.js';
import ChapterIDs, {
    type ChapterIDKey,
    type TOCHeaderKey,
} from './ChapterID.js';
import type { DocumentReference } from 'firebase/firestore';
import type Book from './Book';
import type FormatNode from '../chapter/FormatNode';
import type { EditionInfo } from './Book';

export type EditionSpecification = {
    bookRef: DocumentReference;
    // The title of the book.
    title: string;
    // A numerical string indicating the version of the book. Can be any string, but is sorted alphanumerically.
    number: number;
    // A summary of the revisions in the edition
    summary: string;
    // A time stamp or nothing, indicating when the book was published.
    published: number | null;
    authors: string[];
    /** Custom images for built-in chapters */
    images: Record<ChapterIDKey, string | null>;
    /** Optional custom names for built-in chapters */
    headers?: Record<ChapterIDKey | TOCHeaderKey, string> | undefined;
    description: string;
    chapters: ChapterSpecification[];
    license: string;
    acknowledgements: string;
    tags: string[];
    sources: Record<string, string>;
    references: Record<string, string | string[]>;
    symbols: Record<string, string>;
    glossary: Record<string, Definition>;
    theme: Theme | null;
    base: string | null;
    /** People who have edit access to this edition */
    uids: string[];
    /** All uids who have edit access to at least one chapter. Used in firestore rules to give permission to update book. */
    chapteruids: string[];
    active: Record<string, string>;
    /** An optional Google Analytics tag ID */
    gtagid: string | null;
};

export default class Edition {
    readonly bookRef: DocumentReference;
    readonly editionRef: DocumentReference | undefined;
    readonly uids: string[];
    readonly title: string;
    readonly authors: string[];
    readonly number: number;
    readonly summary: string;
    readonly published: number | null;
    readonly images: Record<string, string | null>;
    readonly headers: Record<ChapterIDKey | TOCHeaderKey, string> | undefined;
    readonly description: string;
    readonly chapters: Chapter[];
    readonly license: string;
    readonly acknowledgements: string;
    readonly tags: string[];
    readonly sources: Record<string, string>;
    readonly references: Record<string, Reference | FormatNode>;
    readonly symbols: Record<string, string>;
    readonly glossary: Record<string, Definition>;
    readonly theme: Theme | null;
    readonly base: string | null;
    readonly active: Record<string, string>;
    readonly gtagid: string | null;

    // Given an object with a valid specification and an object mapping chapter IDs to chapter text,
    // construct an object representing a book.
    constructor(
        bookRef: DocumentReference,
        editionRef: DocumentReference | undefined,
        uids: string[],
        title: string,
        authors: string[],
        number: number,
        summary: string,
        published: number | null,
        images: Record<string, string | null>,
        headers: Record<ChapterIDKey | TOCHeaderKey, string> | undefined,
        description: string,
        chapters: Chapter[],
        license: string,
        acknowledgements: string,
        tags: string[],
        sources: Record<string, string>,
        references:
            | Record<string, string | string[]>
            | Record<string, FormatNode | Reference>,
        symbols: Record<string, string>,
        glossary: Record<string, Definition>,
        theme: Theme | null,
        base: string | null,
        active: Record<string, string>,
        gtagid: string | null,
    ) {
        this.bookRef = bookRef;
        this.editionRef = editionRef;
        this.uids = uids;
        this.title = title;
        this.authors = authors;
        this.number = number;
        this.summary = summary;
        this.published = published;
        this.images = images;
        this.headers = headers;
        this.description = description;
        this.chapters = chapters.slice();
        this.license = license;
        this.acknowledgements = acknowledgements;
        this.tags = tags.slice();
        this.sources = Object.assign({}, sources);
        this.references = {};
        for (const [citationID, ref] of Object.entries(references)) {
            this.references[citationID] =
                ref instanceof Reference
                    ? ref
                    : Edition.parseReference(citationID, ref, this);
        }
        this.symbols = Object.assign({}, symbols);
        this.glossary = Object.assign({}, glossary);
        this.theme = theme;
        this.base = base;
        this.active = active;
        this.gtagid = gtagid;
    }

    static fromJSON(
        editionRef: DocumentReference | undefined,
        spec: EditionSpecification,
    ) {
        // Copy all of the specification metadata to fields.
        // Choose suitable defaults if the spec is lacking a field.
        return new Edition(
            spec.bookRef,
            editionRef,
            spec.uids,
            spec.title,
            spec.authors,
            spec.number,
            spec.summary,
            spec.published,
            spec.images,
            spec.headers,
            spec.description,
            spec.chapters.map((chap) => Chapter.fromJSON(chap)),
            spec.license,
            spec.acknowledgements,
            spec.tags ?? [],
            spec.sources ?? {},
            spec.references ?? {},
            spec.symbols ?? {},
            spec.glossary ?? {},
            spec.theme,
            spec.base,
            spec.active,
            spec.gtagid,
        );
    }

    static parseReference(
        citationID: string,
        ref: string | string[],
        edition: Edition,
        short = false,
    ) {
        if (typeof ref === 'string') return Parser.parseFormat(edition, ref);
        else {
            // APA Format. Could eventually support multiple formats.
            let [authors, year, title, source, url, summary] = ref;

            if (source.charAt(0) === '#') {
                let src = edition.getSource(source);
                if (src !== null) source = src;
            }

            return new Reference(
                citationID,
                authors ?? '',
                year ?? '',
                title ?? '',
                source ?? '',
                url ?? '',
                summary ?? '',
                short,
            );
        }
    }

    // Convert the book to an object for storage.
    toObject(): EditionSpecification {
        const references: Record<string, string | string[]> = {};
        for (const [citationID, ref] of Object.entries(this.references))
            references[citationID] =
                ref instanceof Reference ? ref.toList() : ref.toBookdown();

        const editionJSON: EditionSpecification = {
            bookRef: this.bookRef,
            title: this.title,
            authors: this.authors,
            number: this.number,
            summary: this.summary,
            published: this.published,
            images: Object.assign({}, this.images),
            headers: Object.assign({}, this.headers),
            description: this.description,
            chapters: this.chapters.map((chap) => chap.toJSON()),
            license: this.license,
            acknowledgements: this.acknowledgements,
            tags: this.tags.slice(),
            sources: Object.assign({}, this.sources),
            references: references,
            symbols: Object.assign({}, this.symbols),
            glossary: Object.assign({}, this.glossary),
            theme: this.theme,
            base: this.base && this.base.length > 0 ? this.base : null,
            uids: this.uids.slice(),
            chapteruids: this.getChapterUIDS(),
            active: this.active,
            gtagid: this.gtagid ?? null,
        };
        return editionJSON;
    }

    getBookRef() {
        return this.bookRef;
    }

    getEditionRef() {
        return this.editionRef;
    }

    getChapterUIDS() {
        return Array.from(
            new Set(this.chapters.map((chapter) => chapter.uids).flat()),
        );
    }

    withRef(editionRef: DocumentReference | undefined) {
        return new Edition(
            this.bookRef,
            editionRef,
            this.uids,
            this.title,
            this.authors,
            this.number,
            this.summary,
            this.published,
            this.images,
            this.headers,
            this.description,
            this.chapters,
            this.license,
            this.acknowledgements,
            this.tags,
            this.sources,
            this.references,
            this.symbols,
            this.glossary,
            this.theme,
            this.base,
            this.active,
            this.gtagid,
        );
    }

    getTitle() {
        return this.title;
    }

    withTitle(title: string): Edition {
        return new Edition(
            this.bookRef,
            this.editionRef,
            this.uids,
            title,
            this.authors,
            this.number,
            this.summary,
            this.published,
            this.images,
            this.headers,
            this.description,
            this.chapters,
            this.license,
            this.acknowledgements,
            this.tags,
            this.sources,
            this.references,
            this.symbols,
            this.glossary,
            this.theme,
            this.base,
            this.active,
            this.gtagid,
        );
    }

    getDescription() {
        return this.description;
    }
    setDescription(description: string): Edition {
        return new Edition(
            this.bookRef,
            this.editionRef,
            this.uids,
            this.title,
            this.authors,
            this.number,
            this.summary,
            this.published,
            this.images,
            this.headers,
            description,
            this.chapters,
            this.license,
            this.acknowledgements,
            this.tags,
            this.sources,
            this.references,
            this.symbols,
            this.glossary,
            this.theme,
            this.base,
            this.active,
            this.gtagid,
        );
    }

    getAcknowledgements() {
        return this.acknowledgements;
    }

    withAcknowledgements(acks: string) {
        return new Edition(
            this.bookRef,
            this.editionRef,
            this.uids,
            this.title,
            this.authors,
            this.number,
            this.summary,
            this.published,
            this.images,
            this.headers,
            this.description,
            this.chapters,
            this.license,
            acks,
            this.tags,
            this.sources,
            this.references,
            this.symbols,
            this.glossary,
            this.theme,
            this.base,
            this.active,
            this.gtagid,
        );
    }

    withSummary(summary: string) {
        return new Edition(
            this.bookRef,
            this.editionRef,
            this.uids,
            this.title,
            this.authors,
            this.number,
            summary,
            this.published,
            this.images,
            this.headers,
            this.description,
            this.chapters,
            this.license,
            this.acknowledgements,
            this.tags,
            this.sources,
            this.references,
            this.symbols,
            this.glossary,
            this.theme,
            this.base,
            this.active,
            this.gtagid,
        );
    }

    asPublished(published: boolean) {
        return new Edition(
            this.bookRef,
            this.editionRef,
            this.uids,
            this.title,
            this.authors,
            this.number,
            this.summary,
            published ? Date.now() : null,
            this.images,
            this.headers,
            this.description,
            this.chapters,
            this.license,
            this.acknowledgements,
            this.tags,
            this.sources,
            this.references,
            this.symbols,
            this.glossary,
            this.theme,
            this.base,
            this.active,
            this.gtagid,
        );
    }

    getLicense() {
        return this.license;
    }
    setLicense(license: string) {
        return new Edition(
            this.bookRef,
            this.editionRef,
            this.uids,
            this.title,
            this.authors,
            this.number,
            this.summary,
            this.published,
            this.images,
            this.headers,
            this.description,
            this.chapters,
            license,
            this.acknowledgements,
            this.tags,
            this.sources,
            this.references,
            this.symbols,
            this.glossary,
            this.theme,
            this.base,
            this.active,
            this.gtagid,
        );
    }

    getChapters() {
        return this.chapters.slice();
    }

    hasChapter(chapterID: string): boolean {
        return (
            this.getChapter(chapterID) !== undefined ||
            ['references', 'glossary', 'index', 'search', 'media'].includes(
                chapterID,
            )
        );
    }

    getChapter(chapterID: string): Chapter | undefined {
        return this.chapters.find((chapter) => chapter.getID() === chapterID);
    }

    getChapterByRef(ref: DocumentReference): Chapter | undefined {
        return this.chapters.find(
            (chap) => chap.ref !== undefined && chap.ref.id === ref.id,
        );
    }

    getChapterPosition(chapterID: string): number | undefined {
        var position = 0;
        for (; position < this.chapters.length; position++)
            if (this.chapters[position].getID() === chapterID) return position;

        return undefined;
    }

    getChapterCount() {
        return this.chapters.length;
    }

    withChapters(chapters: Chapter[]) {
        return new Edition(
            this.bookRef,
            this.editionRef,
            this.uids,
            this.title,
            this.authors,
            this.number,
            this.summary,
            this.published,
            this.images,
            this.headers,
            this.description,
            chapters,
            this.license,
            this.acknowledgements,
            this.tags,
            this.sources,
            this.references,
            this.symbols,
            this.glossary,
            this.theme,
            this.base,
            this.active,
            this.gtagid,
        );
    }

    withChapterText(textByID: Map<string, string>) {
        const newChapters = this.chapters.map((chapter) => {
            if (chapter.ref === undefined) {
                return chapter;
            }
            const text = textByID.get(chapter.ref.id);
            return text === undefined ? chapter : chapter.withText(text);
        });
        return this.withChapters(newChapters);
    }

    withRevisedChapter(previous: Chapter, edited: Chapter) {
        return this.withChapters(
            this.chapters.map((chapter) => {
                // Is this the edited chapter? Return the edited one.
                if (chapter === previous) return edited;

                // If it's a different chapter, did the chapter change it's ID? Change all links to the chapter to have the new ID.
                if (previous.id !== edited.id) {
                    // Start with the chapter as is.
                    let newChapter = chapter;

                    // Replace the chapter ID in the chapter's text.
                    if (newChapter.text !== null) {
                        const revisedText = newChapter.text.replaceAll(
                            new RegExp(
                                `\\|(${previous.id})(:[a-zA-Z0-9]+)?\\]`,
                                'g',
                            ),
                            `|${edited.id}$2]`,
                        );
                        if (revisedText !== chapter.text) {
                            newChapter = newChapter.withText(revisedText);
                            console.log(
                                'Updated chapter text: ' + newChapter.text,
                            );
                        }
                    }

                    // Return the possibily revised chapter.
                    return newChapter;
                }
                // Otherwise, just return the chapter as is.
                else return chapter;
            }),
        );
    }

    withoutRefs() {
        return this.withRef(undefined).withChapters(
            this.chapters.map((chap) => chap.withoutRef()),
        );
    }

    withIncrementedEditionNumber() {
        return new Edition(
            this.bookRef,
            this.editionRef,
            this.uids,
            this.title,
            this.authors,
            this.number + 1,
            this.summary,
            this.published,
            this.images,
            this.headers,
            this.description,
            this.chapters,
            this.license,
            this.acknowledgements,
            this.tags,
            this.sources,
            this.references,
            this.symbols,
            this.glossary,
            this.theme,
            this.base,
            this.active,
            this.gtagid,
        );
    }

    withNewChapter() {
        // Synthesize a chapter ID placeholder that doesn't overlap with existing chapter names
        let number = 1;
        while (this.hasChapter('chapter' + number)) number++;

        // Create a default chapter on this model. Remember the document reference so we can modify it later.
        const newChapter = new Chapter(
            undefined,
            `chapter${number}`,
            'Untitled Chapter',
            [],
            null,
            true,
            false,
            undefined,
            '',
            [],
        );
        return this.withChapters([...this.chapters, newChapter]);
    }

    hasChapterRefID(id: string) {
        return this.chapters.some((chapter) => chapter.hasRefID(id));
    }

    withoutChapter(chapterID: string): Edition {
        let index = this.chapters.findIndex(
            (chapter) => chapter.getID() === chapterID,
        );
        if (index < 0) return this;

        return this.withChapters([
            ...this.chapters.slice(0, index),
            ...this.chapters.slice(index + 1),
        ]);
    }

    withMovedChapter(chapterID: string, increment: number): Edition {
        // Get the index of the chapter.
        let index = this.chapters.findIndex(
            (chapter) => chapter.getID() === chapterID,
        );
        if (index + increment < 0 || index + increment >= this.chapters.length)
            return this;

        const newChapters = this.chapters.slice();
        const temp = newChapters[index + increment];
        newChapters[index + increment] = newChapters[index];
        newChapters[index] = temp;

        return new Edition(
            this.bookRef,
            this.editionRef,
            this.uids,
            this.title,
            this.authors,
            this.number,
            this.summary,
            this.published,
            this.images,
            this.headers,
            this.description,
            newChapters,
            this.license,
            this.acknowledgements,
            this.tags,
            this.sources,
            this.references,
            this.symbols,
            this.glossary,
            this.theme,
            this.base,
            this.active,
            this.gtagid,
        );
    }

    getSymbols() {
        return this.symbols;
    }

    hasReferences() {
        return Object.keys(this.references).length > 0;
    }

    getReferences() {
        return Object.assign({}, this.references);
    }

    getReference(citationID: string) {
        return citationID in this.references
            ? this.references[citationID]
            : undefined;
    }

    withReferences(newReferences: Record<string, FormatNode | Reference>) {
        return new Edition(
            this.bookRef,
            this.editionRef,
            this.uids,
            this.title,
            this.authors,
            this.number,
            this.summary,
            this.published,
            this.images,
            this.headers,
            this.description,
            this.chapters,
            this.license,
            this.acknowledgements,
            this.tags,
            this.sources,
            newReferences,
            this.symbols,
            this.glossary,
            this.theme,
            this.base,
            this.active,
            this.gtagid,
        );
    }

    withNewReferences(references: Reference[]): Edition {
        const newReferences = Object.assign({}, this.references);
        // Generate a unique ID for the reference.
        for (const newRef of references)
            newReferences[newRef.citationID] = newRef;
        return this.withReferences(newReferences);
    }

    withEditedReference(ref: Reference) {
        if (!(ref.citationID in this.references)) return this;
        const newReferences = Object.assign({}, this.references);
        newReferences[ref.citationID] = ref;
        return this.withReferences(newReferences);
    }

    withEditedReferenceID(newCitationID: string, ref: Reference) {
        if (!(ref.citationID in this.references)) return;
        const newReferences = Object.assign({}, this.references);
        delete newReferences[ref.citationID];
        newReferences[newCitationID] = ref.withCitationID(newCitationID);
        return this.withReferences(newReferences);
    }

    withoutReference(citationID: string) {
        if (!(citationID in this.references)) return this;
        const newReferences = Object.assign({}, this.references);
        delete newReferences[citationID];
        return this.withReferences(newReferences);
    }

    hasGlossary() {
        return Object.keys(this.glossary).length > 0;
    }

    getGlossary() {
        return Object.assign({}, this.glossary);
    }

    hasDefinition(id: string) {
        return id in this.glossary;
    }

    withGlossary(glossary: Record<string, Definition>) {
        return new Edition(
            this.bookRef,
            this.editionRef,
            this.uids,
            this.title,
            this.authors,
            this.number,
            this.summary,
            this.published,
            this.images,
            this.headers,
            this.description,
            this.chapters,
            this.license,
            this.acknowledgements,
            this.tags,
            this.sources,
            this.references,
            this.symbols,
            glossary,
            this.theme,
            this.base,
            this.active,
            this.gtagid,
        );
    }

    withDefinition(
        id: string,
        phrase: string,
        definition: string,
        synonyms: string[],
    ): Edition {
        const newGlossary = Object.assign({}, this.glossary);
        newGlossary[id] = {
            phrase: phrase,
            definition: definition,
            synonyms: synonyms,
        };
        return this.withGlossary(newGlossary);
    }

    withoutDefinition(id: string): Edition {
        const newGlossary = Object.assign({}, this.glossary);
        delete newGlossary[id];
        return this.withGlossary(newGlossary);
    }

    withEditedDefinition(id: string, definition: Definition): Edition {
        const newGlossary = Object.assign({}, this.glossary);
        newGlossary[id] = definition;
        return this.withGlossary(newGlossary);
    }

    withEditedDefinitionID(id: string, newID: string) {
        if (!(id in this.glossary)) return;
        const newGlossary = Object.assign({}, this.glossary);
        const definition = newGlossary[id];
        delete newGlossary[id];
        newGlossary[newID] = definition;
        return this.withGlossary(newGlossary);
    }

    getTags() {
        return this.tags;
    }

    getTheme() {
        return this.theme;
    }

    withTheme(theme: Theme | null) {
        return new Edition(
            this.bookRef,
            this.editionRef,
            this.uids,
            this.title,
            this.authors,
            this.number,
            this.summary,
            this.published,
            this.images,
            this.headers,
            this.description,
            this.chapters,
            this.license,
            this.acknowledgements,
            this.tags,
            this.sources,
            this.references,
            this.symbols,
            this.glossary,
            theme,
            this.base,
            this.active,
            this.gtagid,
        );
    }

    withThemeValue(group: string, name: string, value: string) {
        if (this.theme === null) return this;
        if (group === 'imports') return this;
        const newTheme: Record<string, Record<string, string>> = Object.assign(
            {},
            this.theme as Record<string, Record<string, string>>,
        );
        const newGroup: Record<string, string> = Object.assign(
            {},
            (this.theme as Record<string, Record<string, string>>)[group],
        );
        newGroup[name] = value;
        newTheme[group] = newGroup;
        return this.withTheme(newTheme);
    }

    // Edited if chapters have their own authors
    isEdited() {
        return this.chapters.some((chapter) => chapter.getAuthors().length > 0);
    }

    // Don't let callers get their sneaky hands on this mutable array...
    getAuthors() {
        return [...this.authors];
    }

    getAuthorsText() {
        return this.getAuthors()
            .map((author) => Parser.parseFormat(this, author).toText())
            .join(', ');
    }

    withAuthors(authors: string[]) {
        return new Edition(
            this.bookRef,
            this.editionRef,
            this.uids,
            this.title,
            authors,
            this.number,
            this.summary,
            this.published,
            this.images,
            this.headers,
            this.description,
            this.chapters,
            this.license,
            this.acknowledgements,
            this.tags,
            this.sources,
            this.references,
            this.symbols,
            this.glossary,
            this.theme,
            this.base,
            this.active,
            this.gtagid,
        );
    }

    withAuthor(name: string) {
        return this.withAuthors([...this.authors, name]);
    }

    withAuthorName(index: number, name: string) {
        if (index < 0 || index >= this.authors.length) return this;
        return this.withAuthors([
            ...this.authors.slice(0, index),
            name,
            ...this.authors.slice(index + 1),
        ]);
    }

    withoutAuthor(index: number) {
        if (index < 0 || index >= this.authors.length) return this;
        return this.withAuthors([
            ...this.authors.slice(0, index),
            ...this.authors.slice(index + 1),
        ]);
    }

    withEditors(uids: string[]) {
        return new Edition(
            this.bookRef,
            this.editionRef,
            uids,
            this.title,
            this.authors,
            this.number,
            this.summary,
            this.published,
            this.images,
            this.headers,
            this.description,
            this.chapters,
            this.license,
            this.acknowledgements,
            this.tags,
            this.sources,
            this.references,
            this.symbols,
            this.glossary,
            this.theme,
            this.base,
            this.active,
            this.gtagid,
        );
    }

    hasImage(id: ChapterIDKey) {
        return this.images[id] !== null;
    }

    getImage(id: ChapterIDKey | string) {
        return this.images[id] ?? null;
    }

    withImage(id: string, embed: string | null) {
        const newImages = Object.assign({}, this.images);
        newImages[id] = embed;
        return new Edition(
            this.bookRef,
            this.editionRef,
            this.uids,
            this.title,
            this.authors,
            this.number,
            this.summary,
            this.published,
            newImages,
            this.headers,
            this.description,
            this.chapters,
            this.license,
            this.acknowledgements,
            this.tags,
            this.sources,
            this.references,
            this.symbols,
            this.glossary,
            this.theme,
            this.base,
            this.active,
            this.gtagid,
        );
    }

    isEditor(uid: string) {
        return this.uids.includes(uid);
    }

    isChapterEditor(uid: string) {
        return this.getChapterUIDS().includes(uid);
    }

    getLeasee(content: string): string | undefined {
        return this.active[content];
    }

    hasLease(uid: string, content: string) {
        return this.active[content] === uid;
    }

    isLeased(contentID: string) {
        return contentID in this.active;
    }

    withLock(uid: string, content: string, lock: boolean) {
        const newActive = Object.assign({}, this.active);
        if (lock) newActive[content] = uid;
        else delete newActive[content];

        return new Edition(
            this.bookRef,
            this.editionRef,
            this.uids,
            this.title,
            this.authors,
            this.number,
            this.summary,
            this.published,
            this.images,
            this.headers,
            this.description,
            this.chapters,
            this.license,
            this.acknowledgements,
            this.tags,
            this.sources,
            this.references,
            this.symbols,
            this.glossary,
            this.theme,
            this.base,
            newActive,
            this.gtagid,
        );
    }

    withGTag(gtagid: string | null) {
        return new Edition(
            this.bookRef,
            this.editionRef,
            this.uids,
            this.title,
            this.authors,
            this.number,
            this.summary,
            this.published,
            this.images,
            this.headers,
            this.description,
            this.chapters,
            this.license,
            this.acknowledgements,
            this.tags,
            this.sources,
            this.references,
            this.symbols,
            this.glossary,
            this.theme,
            this.base,
            this.active,
            gtagid,
        );
    }

    getBookReadingTime() {
        return this.chapters
            .map((chapter) => chapter.getReadingTime(this))
            .reduce(
                (total: number, time) =>
                    total === undefined
                        ? 0
                        : time === undefined || time === null
                          ? total
                          : total + time,
                0,
            );
    }

    getChapterNumber(chapterID: string) {
        let chapterNumber = 1;
        let match = null;
        this.chapters.forEach((chapter) => {
            // If we found a match...
            if (chapter.getID() === chapterID) {
                match = chapterNumber;
                // And it's an unnumbered chapter, set to null.
                if (!chapter.isNumbered()) match = null;
            }
            // Otherwise, increment if it's numbered.
            else if (chapter.isNumbered()) chapterNumber++;
        });
        // Remember the number if we found it.
        if (match !== null) return match;
        else return undefined;
    }

    getSource(sourceID: string) {
        return sourceID.charAt(0) === '#' &&
            sourceID.substring(1) in this.sources
            ? this.sources[sourceID.substring(1)]
            : null;
    }

    getChapterName(chapterID: string): string | undefined {
        const chapter = this.getChapter(chapterID);
        return chapter?.getTitle();
    }

    getChapterSection(chapterID: string): string | undefined {
        const chapter = this.getChapter(chapterID);
        return chapter?.getSection();
    }

    getFootnoteSymbol(number: number) {
        let symbols = 'abcdefghijklmnopqrstuvwxyz';
        // Let's hope there are never more than 26^2 footnotes in a single chapter...
        return number < symbols.length
            ? symbols.charAt(number)
            : symbols.charAt(Math.floor(number / symbols.length) - 1) +
                  symbols.charAt(number % symbols.length);
    }

    getBookIndex(): Record<string, Set<string>> {
        // A map from word to a map of chapters containing the word
        const bookIndex: Record<string, Set<string>> = {};

        // Construct the index by building a dictionary of chapters in which each word appears.
        this.chapters.forEach((chapter) => {
            let index = chapter.getIndex(this);
            if (index)
                Object.keys(index).forEach((word) => {
                    if (word !== '' && word.length > 2) {
                        if (!(word in bookIndex)) bookIndex[word] = new Set();
                        bookIndex[word].add(chapter.getID());
                    }
                });
        });

        return bookIndex;
    }

    // Given the current chapter, find the available chapter after it.
    getNextChapterID(chapterID: string, editable: boolean) {
        // Handle back matter chapters.
        switch (chapterID) {
            case ChapterIDs.ReferencesID:
                return this.hasGlossary()
                    ? ChapterIDs.GlossaryID
                    : ChapterIDs.IndexID;
            case ChapterIDs.GlossaryID:
                return ChapterIDs.IndexID;
            case ChapterIDs.IndexID:
                return ChapterIDs.SearchID;
            case ChapterIDs.SearchID:
                return ChapterIDs.MediaID;
            case ChapterIDs.MediaID:
                return ChapterIDs.TableOfContentsID;
            case ChapterIDs.TableOfContentsID:
                return this.chapters.length > 0
                    ? this.chapters[0].getID()
                    : null;
            default:
                let after = false;
                for (let i = 0; i < this.chapters.length; i++) {
                    let chapter = this.chapters[i];
                    if (chapter.getID() === chapterID) after = true;
                    // If we're after the given chapter and it's not forthcoming.
                    else if (after && (!chapter.isForthcoming() || editable))
                        return chapter.getID();
                }
                // If the given ID was the last chapter, go to the next back matter chapter.
                if (after)
                    return this.hasReferences()
                        ? ChapterIDs.ReferencesID
                        : this.hasGlossary()
                          ? ChapterIDs.GlossaryID
                          : ChapterIDs.IndexID;
                // Otherwise, it wasn't a valid ID
                else return null;
        }
    }

    // Given a chapter id, find the available chapter before it.
    getPreviousChapterID(chapterID: string, editable: boolean) {
        switch (chapterID) {
            // Handle back matter chapters.
            case ChapterIDs.ReferencesID:
                return this.chapters.length > 0
                    ? this.chapters[this.chapters.length - 1].getID()
                    : null; // Last chapter of the book
            case ChapterIDs.GlossaryID:
                return this.hasReferences()
                    ? ChapterIDs.ReferencesID
                    : this.chapters.length > 0
                      ? this.chapters[this.chapters.length - 1].getID()
                      : ChapterIDs.TableOfContentsID;
            case ChapterIDs.IndexID:
                return this.hasGlossary()
                    ? ChapterIDs.GlossaryID
                    : this.hasReferences()
                      ? ChapterIDs.ReferencesID
                      : this.chapters.length > 0
                        ? this.chapters[this.chapters.length - 1].getID()
                        : ChapterIDs.TableOfContentsID;
            case ChapterIDs.SearchID:
                return ChapterIDs.IndexID;
            case ChapterIDs.MediaID:
                return ChapterIDs.SearchID;
            default:
                let before = false;
                for (let i = this.chapters.length - 1; i >= 0; i--) {
                    let chapter = this.chapters[i];
                    if (chapter.getID() === chapterID) before = true;
                    // If we're before the given chapter and it's not forthcoming.
                    else if (before && (!chapter.isForthcoming() || editable))
                        return chapter.getID();
                }
                // If the given ID was the last chapter, go to the next back matter chapter.
                if (before) return ChapterIDs.TableOfContentsID;
                // Otherwise, it wasn't a valid ID
                else return null;
        }
    }

    // Get all of the embeds in the book
    getEmbeds(): { embed: EmbedNode; chapterID: string | undefined }[] {
        let embeds: { embed: EmbedNode; chapterID: string | undefined }[] = [];

        // Add the book cover
        const cover = this.getImage('cover');
        if (cover) {
            let coverNode = Parser.parseEmbed(this, cover);
            if (coverNode instanceof EmbedNode)
                embeds.push({ embed: coverNode, chapterID: undefined });
        }

        // Add the cover and images from each chapter.
        this.getChapters().forEach((c) => {
            const image = c.getImage();
            let cover =
                image === null ? undefined : Parser.parseEmbed(this, image);
            if (cover && cover instanceof EmbedNode)
                embeds.push({ embed: cover, chapterID: c.id });

            // Get the chapter body's embeds
            let bodyEmbeds = c?.getAST(this)?.getEmbeds();
            if (bodyEmbeds)
                bodyEmbeds.forEach((embed: EmbedNode) =>
                    embeds.push({ embed, chapterID: c.id }),
                );
        });

        // Add the back matter covers
        let backmatter: ChapterIDKey[] = [
            'references',
            'glossary',
            'index',
            'search',
            'media',
        ];
        backmatter.forEach((id) => {
            const img = this.getImage(id);
            if (img) {
                let image = Parser.parseEmbed(this, img);
                if (image instanceof EmbedNode)
                    embeds.push({ embed: image, chapterID: id });
            }
        });

        return embeds;
    }

    isLatestEdition(book: Book): boolean {
        const latestEditionID = book.getLatestEditionID();
        return (
            latestEditionID !== undefined &&
            latestEditionID === this.editionRef?.id
        );
    }

    isLatestPublishedEdition(book: Book): boolean {
        const latestEditionID = book.getLatestPublishedEditionID();
        return (
            latestEditionID !== undefined &&
            latestEditionID === this.editionRef?.id
        );
    }

    /** Get the custom header, if there is one */
    getHeader(id: ChapterIDKey | TOCHeaderKey): string {
        const header = this.headers ? this.headers[id] : undefined;
        if (header) return header;
        return {
            references: 'References',
            glossary: 'Glossary',
            index: 'Index',
            search: 'Search',
            media: 'Media',
            unknown: 'Oops...',
            acknowledgements: 'Acknowledgements',
            license: 'License',
            print: 'Print',
            citation: 'Citation',
            chapters: 'Chapters',
            cover: 'Cover',
        }[id];
    }

    withHeader(id: ChapterIDKey | TOCHeaderKey, header: string) {
        const newHeaders = Object.assign({}, this.headers);
        newHeaders[id] = header;
        return new Edition(
            this.bookRef,
            this.editionRef,
            this.uids,
            this.title,
            this.authors,
            this.number,
            this.summary,
            this.published,
            this.images,
            { ...newHeaders },
            this.description,
            this.chapters,
            this.license,
            this.acknowledgements,
            this.tags,
            this.sources,
            this.references,
            this.symbols,
            this.glossary,
            this.theme,
            this.base,
            this.active,
            this.gtagid,
        );
    }

    getEditionNumber() {
        return this.number;
    }

    getEditionLabel() {
        const num = this.number;
        return `${num}${
            num === 1 ? 'st' : num === 2 ? 'nd' : num === 3 ? 'rd' : ''
        }`;
    }

    getInfo(): EditionInfo | undefined {
        return this.editionRef === undefined
            ? undefined
            : {
                  ref: this.editionRef,
                  summary: this.summary,
                  number: this.number,
                  published: this.published,
                  editionuids: this.uids,
                  chapteruids: Array.from(
                      new Set(
                          this.chapters.map((chapter) => chapter.uids).flat(),
                      ),
                  ),
              };
    }
}
