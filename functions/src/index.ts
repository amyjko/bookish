import functions from 'firebase-functions';
import { ObjectMetadata } from 'firebase-functions/v1/storage';
import admin from 'firebase-admin';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { spawn } from 'child_process';
import { EditionSpecification } from 'bookish-press/models/book/Edition';
import { zip } from 'zip-a-folder';

admin.initializeApp();

function getThumbnailPath(filePath: string) {
    const fileName = path.basename(filePath);
    const thumbFileName = `${fileName}`;
    return path.join(path.dirname(filePath), 'thumbnails/', thumbFileName);
}

async function resizeImage(
    filePath: string,
    bucketID: string,
    contentType: string | undefined
) {
    const fileName = path.basename(filePath);

    // Download file from bucket into a temporary location.
    const bucket = admin.storage().bucket(bucketID);
    const tempFilePath = path.join(os.tmpdir(), fileName);
    console.log('Downloading image to', tempFilePath);

    await bucket.file(filePath).download({ destination: tempFilePath });

    // Generate a thumbnail using ImageMagick, which is installed by default in Google Cloud.
    // Note: to test locally, ImageMagick has to be installed locally.
    // If you're getting "Error: spawn convert ENOENT" when using the emu.ator, it's because it's not
    // installed locally. On mac OS, "brew install imagemagick" should suffice.
    console.log('Resizing downloaded image...');
    await execute('convert', [
        tempFilePath,
        '-thumbnail',
        '320x320>',
        tempFilePath,
    ]);

    const thumbFilePath = getThumbnailPath(filePath);

    console.log('Uploading resized image to ', thumbFilePath);

    // Uploading the thumbnail.
    await bucket.upload(tempFilePath, {
        destination: thumbFilePath,
        metadata: { contentType: contentType },
    });

    // Once the thumbnail has been uploaded delete the local file to free up disk space.
    return await fs.unlinkSync(tempFilePath);
}

export const createThumbnail = functions.storage
    .object()
    .onFinalize(async (object: ObjectMetadata) => {
        if (object.name === undefined) {
            console.log('Unknown file uploaded.');
            return;
        }
        if (!object.name.startsWith('images/')) {
            console.log('Non-image uploaded, ignoring');
            return;
        }
        if (object.name.includes('thumbnails/')) {
            console.log('Thumbnail uploaded, ignoring.');
            return;
        }

        return resizeImage(object.name, object.bucket, object.contentType);
    });

export const deleteThumbnail = functions.storage
    .object()
    .onDelete(async (object: ObjectMetadata) => {
        if (object.name === undefined) {
            console.log('Unknown file uploaded.');
            return;
        }
        if (!object.name.startsWith('images/')) {
            console.log('Non-image deleted, ignoring');
            return;
        }
        if (object.name.includes('thumbnails/')) {
            console.log('Thumbnail deleted, ignoring.');
            return;
        }

        // Download file from bucket into a temporary location.
        const bucket = admin.storage().bucket(object.bucket);
        const thumbFilePath = getThumbnailPath(object.name);

        console.log(`Deleting ${thumbFilePath}`);

        return await bucket.file(thumbFilePath).delete();
    });

export const getUserEmails = functions.https.onCall(
    async (data: { uids: string[] }): Promise<Record<string, string>> => {
        const uids = data.uids;

        const users = await admin.auth().getUsers(
            uids.map((uid) => {
                return { uid };
            })
        );

        const map: Record<string, string> = {};
        users.users.forEach((user) => {
            map[user.uid] = user.email ?? '';
        });

        return map;
    }
);

export const createUserWithEmail = functions.https.onCall(
    async (data: { email: string }): Promise<string | null> => {
        // First try to get the user, in case they already exist.
        try {
            const existingUser = await admin.auth().getUserByEmail(data.email);
            return existingUser.uid;
        } catch (_) {}

        try {
            const user = await admin.auth().createUser({ email: data.email });
            return user.uid;
        } catch (error) {
            console.log(error);
            return null;
        }
    }
);

export const publishEdition = functions
    // This takes some time and some memory -- testing showed that it regularly exceeded 256 MB and >1 minute.
    .runWith({ timeoutSeconds: 300, memory: '1GB' })
    .https.onCall(async (data: { bookID: string; editionID: string }) => {
        const { bookID, editionID } = data;

        // Move to a temporary folder workspace.
        const tempDir = os.tmpdir();
        process.chdir(tempDir);

        console.log(`Created temporary folder at ${tempDir}`);

        // If there's already something in /bookish-reader, remove it all for a fresh build.
        if (fs.existsSync('bookish-reader')) {
            console.log('Cleaning folder to prepare for build...');
            await execute('rm', ['-rf', 'bookish-reader']);
        }

        // Clone the reader repo
        console.log('Cloning book template...');
        await execute('git', [
            'clone',
            'https://github.com/amyjko/bookish-reader',
        ]);

        // Move inside the reader
        console.log('Changing to book folder...');
        process.chdir(path.join(tempDir, 'bookish-reader'));

        // Retrieve the edition
        console.log('Retrieving edition from database...');
        const editionDoc = admin
            .firestore()
            .doc(`books/${bookID}/editions/${editionID}`);
        const editionData = await editionDoc.get();
        if (!editionData.exists) {
            console.log("Couldn't get ediition from firestore, bailing.");
            return "Unknown book edition, can't publish.";
        }

        const editionJSON = editionData.data() as EditionSpecification;

        // Retrieve all edition's chapter text.
        for (const chapter of editionJSON.chapters) {
            console.log(
                `Retrieving chapter ${chapter.id} text and creating its route...`
            );
            if (chapter.ref === undefined) {
                console.log(
                    'No chapter ID in the chapter edition metadata, bailing.'
                );
                return "Missing chapter, can't published book.";
            }
            const chapterPath = `books/${bookID}/editions/${editionID}/chapters/${chapter.ref.id}`;
            const chapterData = await admin.firestore().doc(chapterPath).get();
            if (!chapterData.exists) {
                console.log(`Couldn't resolve chapter "${chapterPath}"`);
                return "Missing chapter text, can't publish.";
            }

            const chapterText = chapterData.data()?.text;
            if (chapterText === undefined) {
                console.log(`Found chapter data, but it had no text."`);
                return "Missing chapter text, can't publishing.";
            }
            chapter.text = chapterText;

            // Create a route for the chapter and a page with renders its contents.
            try {
                const routePath = `src/routes/${chapter.id}`;
                fs.mkdirSync(routePath);
                // Copy the +page.svelte template from the assets folder.
                fs.copyFileSync(
                    `src/lib/assets/+page.svelte`,
                    `${routePath}/+page.svelte`
                );
                console.log(`Created route for chapter ${chapter.id}`);
            } catch (err) {
                console.log(err);
                return `Couldn't create chapter ${chapter.id} route.`;
            }
        }

        // Create a book.json that stores the edition data.
        // the bookish-reader template uses this as a state asset to
        // render the book.
        try {
            console.log('Writing edition.json to assets folder...');
            fs.writeFileSync(
                'src/lib/assets/edition.json',
                JSON.stringify(editionJSON, null, 2)
            );
        } catch (err) {
            console.log(err);
            return `Couldn't create book metadata`;
        }

        // Install all dependencies for the reader, pointing cache to writable /tmp
        try {
            console.log('Installing build dependencies...');
            await execute('npm', ['install', '--cache', tempDir]);
        } catch (err) {
            console.log(err);
            return 'Unable to create book.';
        }

        // Build a static version of the book for the web.
        try {
            console.log('Building book...');
            // Note that we have to vite build with a local cache, since we don't otherwise have write permissions.
            const output = await execute('npm', [
                'exec',
                'vite',
                'build',
                '--cache',
                tempDir,
            ]);

            console.log('Checking if build was successful...');
            if (fs.existsSync('build')) console.log('Successfully built book.');
            else {
                console.log('It was not.');
                console.log('Here are the files in the folder...');
                fs.readdirSync('.').forEach((file) => {
                    console.log(file);
                });

                console.log(
                    `Here is the output of the build (${output.length} chars): ${output}`
                );

                return 'Could not build book.';
            }
        } catch (err) {
            console.log('Could not find reason for build failure: ' + err);
            return 'Could not create book.';
        }

        const zipFileName = 'book.zip';

        try {
            console.log('Zipping book for download...');
            await zip('build', zipFileName);
        } catch (err) {
            console.log("Couldn't zip book: " + err);
            return "Couldn't compress book for download";
        }

        let downloadURL: string | undefined = undefined;
        const bucket = admin.storage().bucket();
        const zipFilePath = `${bookID}/${zipFileName}`;
        try {
            console.log('Compressed book. Uploading to cloud for download...');

            await bucket.upload(zipFileName, {
                destination: zipFilePath,
                metadata: { contentType: 'application/zip' },
            });
        } catch (err) {
            console.log(err);
            return "Couldn't upload the book for download.";
        }

        try {
            console.log('Uploaded zip. Requesting URL for download...');
            [downloadURL] = await bucket.file(zipFilePath).getSignedUrl({
                action: 'read',
                expires: '03-09-2491',
            });
        } catch (err) {
            console.log(err);
            return "Couldn't get the URL for the download.";
        }
        // Upload everything to Firebase Hosting at the appropriate URL

        /**
         *
         * TODO I stopped here. Here's the proper API:
         *
         * https://firebase.google.com/docs/hosting/api-deploy.
         *
         * I got stuck on how to get an access token to call the Hosting API.
         * I obviously can't follow the example of getting a service account key
         * since there's no secure way to deploy one.
         */

        console.log('Skipped hosting deploy :(');

        return { url: downloadURL };
    });

/** Turn spawn into a promise for comprehensibility */
async function execute(cmd: string, args: ReadonlyArray<string>) {
    return new Promise<string>((resolve, reject) => {
        try {
            console.log(`Executing ${cmd} ${args.join(' ')}...`);
            const process = spawn(cmd, args, { stdio: 'inherit' });
            const error: string[] = [];
            const stdout: string[] = [];
            // Save each bit of standard output that comes out.
            // process.stdout.on('data', (data) => {
            //     stdout.push(data.toString());
            // });

            // // Save the errors that come
            // process.on('error', (e) => {
            //     error.push(e.toString());
            // });

            // When the process closes, resolve with the output or errors.
            process.on('close', () => {
                if (error.length) reject(error.join(''));
                else resolve(stdout.join(''));
            });
        } catch (error) {
            reject('' + error);
        }
    });
}
