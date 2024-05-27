/**
 * This script imports a book from a given GitHub repository into a given book ID in production.
 */
import admin from 'firebase-admin';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import AjvModule from 'ajv';
import addFormatsModule from 'ajv-formats';
import Schema from 'bookish-press/Schema';
import chalk from 'chalk';
import { v4 as uuid } from 'uuid';

const log = console.log;

function exit(err) {
    console.log(`𐄂 ${chalk.red(err)}`);
    process.exit(1);
}

function success(message) {
    console.log(`✓ ${chalk.green(message)}`);
}

// There must be exactly four arguments.
if (process.argv.length !== 4) {
    log('usage: node import.js [path-to-book] [bookID]');
    exit("You can get your book's ID from the URL of table of contents page");
}

const bookPath = process.argv[2];

const result = getBook(bookPath);

if (result === undefined)
    exit("The book wasn't valid. Check the errors above.");

const [book, chapterTexts, images] = result;

success(
    `Okay, I received ${chapterTexts.size} chapters spanning ${Array.from(
        chapterTexts.values(),
    ).reduce((count, text) => text.split(' ').length + count, 0)} words and ${
        images.length
    } images`,
);

await upload(process.argv[3], book, chapterTexts, images);

/**
 * Given a book path to a local directory, return [ book, text, images ], where:
 * - book is the book.json object
 * - text is a Map of chapter IDs to chapter text
 * - images is a list of image paths
 * If there are errors, missing chapters, or missing images, returns undefined. */
function getBook(path) {
    if (!existsSync(bookPath)) {
        error("Hm, the path you gave to your book doesn't seem to exist.");
    }

    success("Yay! We found your book folder. Let's look inside.");

    const bookData = readFileSync(join(bookPath, 'book.json'), 'utf8');
    const book = JSON.parse(bookData);

    const Ajv = AjvModule;
    const addFormats = addFormatsModule.default;
    const validator = new Ajv({
        strictTuples: false,
        allErrors: true,
        allowUnionTypes: true,
    });
    addFormats(validator);

    const valid = validator.validate(Schema, book);

    if (!valid) {
        log(validator.errors);
        error('The book.json file has some errors. Fix them, then try again.');
        return;
    }

    success("Found your book, and it's book.json file seems valid! ");
    log("Let's check the chapters/ folder for chapters...");

    const chaptersPath = join(bookPath, 'chapters');

    if (!existsSync(chaptersPath)) error('There is no chapters/ folder');

    const possibleChapterFiles = readdirSync(chaptersPath, 'utf8');
    const chapterTexts = new Map();

    for (const file of possibleChapterFiles) {
        if (file.endsWith('.bd')) {
            let chapterText = readFileSync(join(chaptersPath, file), 'utf8');
            const chapterID = file.split('.')[0];
            let matchingChapter = undefined;
            for (const chapter of book.chapters) {
                if (chapter.id === chapterID) {
                    matchingChapter = chapter;

                    // Process on the symbols of the chapter text, since the web app doesn't support symbol editing.
                    if (book.symbols)
                        for (const [symbol, definition] of Object.entries(
                            book.symbols,
                        )) {
                            chapterText = chapterText.replace(
                                new RegExp('([^\\\\])@' + symbol + '\\b', 'g'),
                                '$1' + definition,
                            );
                        }

                    chapterTexts.set(chapterID, chapterText);
                    break;
                }
            }
            if (matchingChapter === undefined)
                error(`Couldn't find the chapter with ID ${chapterID}`);
        } else log(`Ignoring ${file} because it doesn't end with .bd`);
    }

    success('Read all the chapter text...');
    success(
        "Let's make sure we found the text for each chapter specified in book.json...",
    );

    let foundAll = true;
    for (const chapter of book.chapters) {
        if (!chapterTexts.has(chapter.id)) {
            error(
                `Couldn't find text of chapter "${chapter.id}". Are you sure there's a file "chapters/${chapter.id}.bd"?`,
            );
            foundAll = false;
        }
    }

    if (!foundAll) {
        error("Couldn't find all the chapter text. Check the errors above.");
    }

    success('Found all the expected chapters.');

    const imagesPath = join(path, 'images');
    const images = [];
    if (existsSync(imagesPath)) {
        const possibleImageFiles = readdirSync(imagesPath, 'utf8');
        for (const image of possibleImageFiles) {
            const imagePath = join(imagesPath, image);
            images.push(imagePath);
        }
    } else {
        error('No images path, not adding any images.');
        return;
    }

    success('Okay, we found everything. Ready to import!');

    return [book, chapterTexts, images];
}

/**
 * Given a book object, a map of chapter text by IDs, and a list of images, upload the book.
 * This requires:
 * - Verifying the book ID exists
 * - Deleting all images associated with the book in storage, for a clean slate
 * - Uploading images to Firebase storage, getting URLs for those images
 * - Updating the chapter text to refer to those URLs
 * - Uploading the book chapters and adding their IDs to the book object
 * - Uploading the book object
 */
async function upload(bookID, localEdition, chapters, images) {
    // Initialize the SDK with the service account.
    const app = admin.initializeApp({
        credential: admin.credential.cert(
            `../bookish-prod-firebase-service-key.json`,
        ),
        storageBucket: 'bookish-prod.appspot.com',
    });

    success('Initialized Firebase connection.');

    // Initialize access to various parts of the database.
    const db = admin.firestore();
    const bucket = admin.storage().bucket();
    const books = db.collection('books');

    // Get the book document by the given ID. If it doesn't exist, bail.
    const bookDoc = await books.doc(bookID).get();
    if (!bookDoc.exists) exit(`Book with ID ${bookID} doesn't exist.`);

    // Get the book data and the most recent edition to update
    const remoteBook = bookDoc.data();
    const editionID =
        remoteBook.editions[remoteBook.editions.length - 1].ref.id;

    // Get the edition for the book.
    const editionDoc = await db
        .collection(`books/${bookID}/editions`)
        .doc(editionID)
        .get();

    if (!editionDoc.exists) exit(`Edition with ID ${editionID} doesn't exist.`);
    const remoteEdition = editionDoc.data();

    success('Confirmed that book exists.');

    // Upload every image to Firebase storage, and remember the URL for each.
    const imageURLs = new Map();
    if (images.length > 0) {
        log('Starting image uploads');
        for (const image of images) {
            // Get the image data
            const imageBuffer = readFileSync(image);
            const [, extension] = image.split('.');
            const imageName = image.split('/').pop();
            const file = bucket.file(`images/${bookID}/${imageName}`);
            const token = uuid();
            await file.save(imageBuffer, {
                metadat: { firebaseStorageDownloadTokens: token },
                contentType: `image/${extension}`,
            });
            const url = `https://firebasestorage.googleapis.com/v0/b/bookish-prod.appspot.com/o/images%2F${bookID}%2F${imageName}?alt=media&token=${token}`;
            imageURLs.set(imageName, url);
            success(
                `Uploaded image ${imageURLs.size}/${images.length} ${imageName}`,
            );
        }
    }

    const chaptersPath = `books/${bookID}/editions/${editionID}/chapters`;

    log("Deleting existing chapters in the edition's collection.");

    const collectionRef = db.collection(chaptersPath);
    const query = collectionRef.orderBy('__name__').limit(10);
    await new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
    });

    success('Deleted chapters');

    log('Revising all references to images in the book and creating chapters.');

    for (const imageKey of Object.keys(localEdition.images)) {
        for (const [imageName, url] of imageURLs.entries())
            localEdition.images[imageKey] = localEdition.images[
                imageKey
            ].replace(imageName, url);
    }

    // Go through each chapter, and replace any references to the image names with the URLs we generated
    for (const [id, text] of chapters.entries()) {
        let revisedText = text;

        // Replace all image references
        for (const [imageName, url] of imageURLs.entries())
            revisedText = revisedText.replace(imageName, url);

        // Create the chapter document
        const chapterDoc = await db.collection(chaptersPath).add({
            text,
        });

        // Augment the local edition with the chapter reference
        const chapterEntry = localEdition.chapters.find(
            (chapter) => chapter.id === id,
        );
        if (chapterEntry === undefined)
            exit(
                `Couldn't find chapter with ID "${id}" in the book's edition data`,
            );

        // Initialize the uids since they aren't required in the local edition.
        chapterEntry.uids = [];
        chapterEntry.ref = chapterDoc;

        for (const [imageName, url] of imageURLs.entries())
            chapterEntry.image = chapterEntry.image.replace(imageName, url);
    }

    success('Revised and created all book chapters.');

    // Initialize local edition fields not required in the local schema.
    localEdition.uids = remoteEdition.uids ?? [];
    localEdition.chapteruids = remoteEdition.chapteruids ?? [];
    localEdition.gtagid = remoteEdition.gtagid ?? null;
    localEdition.bookRef = remoteEdition.bookRef ?? bookDoc.ref;
    localEdition.active = {};
    localEdition.theme = localEdition.theme ?? null;

    await db
        .collection(`books/${bookID}/editions`)
        .doc(editionID)
        .set(localEdition);

    success('Updated edition to refer to all chapters.');
}

async function deleteQueryBatch(db, query, resolve) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        // When there are no documents left, we are done
        resolve();
        return;
    }

    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
    });
}
