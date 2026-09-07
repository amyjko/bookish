/**
 * Seeds a demo book into the running Firebase emulators.
 *
 * The book uses every Bookdown construct the reader supports and carries
 * images chosen to stress a small screen, so a change can be checked against
 * something real without hunting for a book that happens to exercise it. The
 * images are generated rather than committed; see demo-images.js.
 *
 * Run it through `npm run demo`, which starts the emulators and the dev server
 * around it. To seed emulators you started yourself, point it at them:
 *
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
 *   FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199 \
 *   FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
 *   GOOGLE_CLOUD_PROJECT=bookish-dev-21ac3 node scripts/seed-demo.js
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';
import { randomUUID } from 'node:crypto';
import { styleText } from 'node:util';
import { demoImages } from './demo-images.js';
import { BOOK, CHAPTERS } from './demo-book.js';

const BOOK_ID = process.env.DEMO_BOOK_ID ?? 'demo';
const EDITION_ID = `${BOOK_ID}edition`;
const OWNER_EMAIL = process.env.DEMO_EMAIL ?? 'demo@example.com';
const OWNER_UID = 'demouser';

const projectID =
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.GCLOUD_PROJECT ??
    'demo-bookish';
const bucketName = process.env.DEMO_BUCKET ?? `${projectID}.appspot.com`;

function say(message) {
    console.log(`${styleText('green', '✓')} ${message}`);
}

function fail(message) {
    console.log(`${styleText('red', '𐄂')} ${message}`);
    process.exit(1);
}

if (process.env.FIRESTORE_EMULATOR_HOST === undefined)
    fail(
        'FIRESTORE_EMULATOR_HOST is not set. This script only ever writes to an emulator, never to a real project.',
    );

// The Cloud Storage client reads STORAGE_EMULATOR_HOST (with a scheme); the
// Firebase admin SDK reads FIREBASE_STORAGE_EMULATOR_HOST (without one).
const storageHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
if (storageHost && process.env.STORAGE_EMULATOR_HOST === undefined)
    process.env.STORAGE_EMULATOR_HOST = `http://${storageHost}`;

const app = initializeApp({ projectId: projectID, storageBucket: bucketName });
const db = getFirestore(app);
const bucket = getStorage(app).bucket();

// The reader reserves these ids for its built-in pages, so a chapter using one
// would be shadowed by the page rather than rendered.
const RESERVED = [
    'references',
    'search',
    'media',
    'index',
    'glossary',
    'unknown',
    'cover',
];
const reserved = CHAPTERS.filter((chapter) => RESERVED.includes(chapter.id));
if (reserved.length > 0)
    fail(
        `These chapters use reserved page ids: ${reserved
            .map((chapter) => chapter.id)
            .join(', ')}. Rename them in demo-book.js.`,
    );

say(`Seeding project ${projectID}, book "${BOOK_ID}".`);

// An account to sign in as, so the write side is reachable too. Signing in
// still goes through the emulator's email link flow at /login.
try {
    await getAuth(app).deleteUser(OWNER_UID);
} catch {
    // No such user yet, which is the normal case.
}
await getAuth(app).createUser({
    uid: OWNER_UID,
    email: OWNER_EMAIL,
    emailVerified: true,
});
say(`Created the account ${OWNER_EMAIL} (sign in at /login).`);

// Upload the images and remember where each one landed, so the chapter text
// can point at them.
const urls = new Map();
for (const image of demoImages()) {
    const path = `images/${BOOK_ID}/${image.name}`;
    const token = randomUUID();
    const file = bucket.file(path);
    await file.save(image.bytes, {
        resumable: false,
        metadata: {
            contentType: image.contentType,
            // What makes the ?alt=media URL below readable.
            metadata: { firebaseStorageDownloadTokens: token },
        },
    });
    urls.set(
        image.name,
        `http://${storageHost}/v0/b/${bucketName}/o/${encodeURIComponent(
            path,
        )}?alt=media&token=${token}`,
    );
}
say(`Uploaded ${urls.size} images to ${bucketName}.`);

/** Replace bare image filenames in Bookdown with their uploaded URLs. */
function withImageURLs(text) {
    if (text === null || text === undefined) return text;
    let resolved = text;
    for (const [name, url] of urls) resolved = resolved.split(name).join(url);
    return resolved;
}

// Remove chapter documents left behind by an earlier seed with different
// chapters, so re-seeding is idempotent rather than cumulative.
const existing = await db
    .collection(`books/${BOOK_ID}/editions/${EDITION_ID}/chapters`)
    .listDocuments();
const wanted = new Set(CHAPTERS.map((chapter) => chapter.id));
for (const doc of existing)
    if (!wanted.has(doc.id)) {
        await doc.delete();
        say(`Removed the stale chapter "${doc.id}".`);
    }

// Chapter text lives in its own document per chapter.
for (const chapter of CHAPTERS)
    await db
        .doc(`books/${BOOK_ID}/editions/${EDITION_ID}/chapters/${chapter.id}`)
        .set({ text: withImageURLs(chapter.text) });
say(`Wrote ${CHAPTERS.length} chapters.`);

const editionPath = `books/${BOOK_ID}/editions/${EDITION_ID}`;
const published = Date.now();

await db.doc(editionPath).set({
    bookRef: db.doc(`books/${BOOK_ID}`),
    title: BOOK.title,
    number: 1,
    summary: 'The first edition of the demo book.',
    // Published, so the reader route serves it without signing in.
    published,
    authors: BOOK.authors,
    images: {
        cover: withImageURLs(BOOK.cover),
        references: null,
        glossary: null,
        index: null,
        search: null,
        media: null,
        unknown: null,
    },
    description: BOOK.description,
    chapters: CHAPTERS.map((chapter) => {
        const spec = {
            ref: db.doc(`${editionPath}/chapters/${chapter.id}`),
            id: chapter.id,
            title: chapter.title,
            authors: chapter.authors ?? [],
            image: withImageURLs(chapter.image) ?? null,
            numbered: chapter.numbered,
            forthcoming: chapter.forthcoming,
            uids: [OWNER_UID],
        };
        if (chapter.section) spec.section = chapter.section;
        return spec;
    }),
    license: BOOK.license,
    acknowledgements: BOOK.acknowledgements,
    tags: BOOK.tags,
    sources: {},
    references: BOOK.references,
    symbols: BOOK.symbols,
    glossary: BOOK.glossary,
    theme: null,
    base: null,
    uids: [OWNER_UID],
    chapteruids: [OWNER_UID],
    active: {},
    gtagid: null,
});

await db.doc(`books/${BOOK_ID}`).set({
    title: BOOK.title,
    authors: BOOK.authors,
    description: BOOK.description,
    cover: withImageURLs(BOOK.cover),
    published: true,
    domain: null,
    editions: [
        {
            ref: db.doc(editionPath),
            summary: 'The first edition of the demo book.',
            number: 1,
            published,
            editionuids: [OWNER_UID],
            chapteruids: [OWNER_UID],
        },
    ],
    uids: [OWNER_UID],
    readuids: [OWNER_UID],
});

say('Wrote the book and its edition.');
console.log(
    `\nRead it at ${styleText('bold', `/${BOOK_ID}`)}, or edit it at ${styleText(
        'bold',
        `/write/${BOOK_ID}/1`,
    )} after signing in as ${OWNER_EMAIL}.`,
);
