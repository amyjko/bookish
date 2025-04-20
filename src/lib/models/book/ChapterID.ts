export type ChapterIDKey =
    | 'references'
    | 'search'
    | 'media'
    | 'index'
    | 'glossary'
    | 'unknown'
    | 'cover';

export type TOCHeaderKey =
    | 'chapters'
    | 'acknowledgements'
    | 'license'
    | 'print'
    | 'citation';

const ChapterIDs: Record<string, ChapterIDKey> = {
    TableOfContentsID: 'cover',
    ReferencesID: 'references',
    SearchID: 'search',
    MediaID: 'media',
    IndexID: 'index',
    GlossaryID: 'glossary',
    UnknownID: 'unknown',
};

export default ChapterIDs;
