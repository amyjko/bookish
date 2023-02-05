const Schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Bookish book schema',
    type: 'object',
    definitions: {
        embed: {
            type: ['string', 'null'],
            pattern: '^\\|.+\\|.+\\|.+\\|.+\\|$',
        },
    },
    required: [
        'title',
        'number',
        'summary',
        'published',
        'authors',
        'images',
        'description',
        'license',
        'acknowledgements',
        'tags',
        'sources',
        'references',
        'chapters',
        'symbols',
        'theme',
    ],
    additionalProperties: false,
    properties: {
        title: { type: 'string' },
        number: { type: 'number' },
        summary: { type: 'string' },
        published: { type: ['number', 'null'] },
        authors: {
            type: 'array',
            items: { type: 'string' },
        },
        images: {
            type: 'object',
            properties: {
                cover: { $ref: '#/definitions/embed' },
                unknown: { $ref: '#/definitions/embed' },
                index: { $ref: '#/definitions/embed' },
                references: { $ref: '#/definitions/embed' },
                glossary: { $ref: '#/definitions/embed' },
                search: { $ref: '#/definitions/embed' },
            },
        },
        description: { type: 'string' },
        acknowledgements: { type: 'string' },
        chapters: {
            type: 'array',
            items: {
                type: 'object',
                required: ['id', 'title', 'image'],
                properties: {
                    id: { type: 'string', pattern: '^[a-zA-Z0-9]+$' },
                    title: { type: 'string' },
                    image: { $ref: '#/definitions/embed' },
                    numbered: { type: 'boolean', default: 'True by default' },
                    section: { type: 'string' },
                    authors: { type: 'array', items: { type: 'string' } },
                    forthcoming: { type: 'boolean' },
                },
            },
        },
        tags: {
            type: 'array',
            items: { type: 'string' },
        },
        license: { type: 'string' },
        sources: { type: 'object', additionalProperties: { type: 'string' } },
        references: {
            type: 'object',
            additionalProperties: {
                oneOf: [
                    { type: 'string' },
                    {
                        type: 'array',
                        minItems: 5,
                        items: [
                            { type: 'string' },
                            { type: 'integer' },
                            { type: 'string' },
                            { type: 'string' },
                            { type: ['string', 'null'], format: 'uri' },
                        ],
                        additionalItems: { type: 'string' },
                    },
                ],
            },
        },
        symbols: {
            type: 'object',
            additionalProperties: { type: 'string' },
        },
        glossary: {
            type: 'object',
            additionalProperties: {
                type: 'object',
                properties: {
                    phrase: { type: 'string' },
                    definition: { type: 'string' },
                    synonyms: { type: 'array', items: { type: 'string' } },
                },
                additionalProperties: false,
                required: ['phrase', 'definition'],
            },
        },
        theme: {
            type: ['object', 'null'],
        },
    },
};

export default Schema;
