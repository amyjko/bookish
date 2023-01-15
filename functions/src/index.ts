import functions from 'firebase-functions';
import { ObjectMetadata } from 'firebase-functions/v1/storage';
import admin from 'firebase-admin';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { spawn } from 'child_process';
import { EditionSpecification } from 'bookish-press/models/book/Edition';

/** Turn spawn into a promise for comprehensibility */
async function exec(cmd: string, args: ReadonlyArray<string>) {
    return new Promise((resolve, reject) => {
        const cp = spawn(cmd, args);
        const error: string[] = [];
        const stdout: string[] = [];
        cp.stdout.on('data', (data) => {
            stdout.push(data.toString());
        });

        cp.on('error', (e) => {
            error.push(e.toString());
        });

        cp.on('close', () => {
            if (error.length) reject(error.join(''));
            else resolve(stdout.join(''));
        });
    });
}

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
    await exec('convert', [
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

export const publishEdition = functions.https.onCall(
    async (data: { book: string; edition: string }) => {
        const { edition: editionID } = data;

        // Move to a temporary folder workspace.
        const tempDir = os.tmpdir();
        process.chdir(tempDir);

        // If there's already something in /bookish-reader, remove it all for a fresh build.
        if (fs.existsSync('bookish-reader')) {
            console.log('Cleaning workspace to prepare for build...');
            await exec('rm', ['-rf', 'bookish-reader']);
        }

        // Clone the reader repo
        console.log('Cloning book template...');
        await exec('git', [
            'clone',
            'https://github.com/amyjko/bookish-reader',
        ]);

        // Move inside the reader
        console.log('Changing to book folder...');
        process.chdir(path.join(tempDir, 'bookish-reader'));

        // Install all dependencies for the reader
        console.log('Install project dependencies...');
        await exec('npm', ['install']);

        // Retrieve the edition
        console.log('Retrieving book edition from database...');
        const editionDoc = admin.firestore().doc(`editions/${editionID}`);
        const editionData = await editionDoc.get();
        if (!editionData.exists) return "Unknown book edition, can't publish.";

        const editionJSON = editionData.data() as EditionSpecification;

        // Retrieve all edition's chapter text.
        for (const chapter of editionJSON.chapters) {
            console.log(
                `Retrieving chapter ${chapter.id} text and creating its route...`
            );
            if (chapter.ref === undefined)
                return "Missing chapter, can't published book.";
            const chapterData = await admin
                .firestore()
                .doc(`editions/${editionID}/chapters/${chapter.ref.id}`)
                .get();
            if (!chapterData.exists)
                return "Missing chapter text, can't publish.";

            const chapterText = chapterData.data()?.text;
            if (chapterText === undefined)
                return "Missing chapter text, can't publishing.";
            chapter.text = chapterText;

            const routePath = `src/routes/${chapter.id}`;
            fs.mkdirSync(routePath);
            fs.writeFileSync(
                `${routePath}/+page.svelte`,
                `<script lang="ts">
                    import ChapterModel from "bookish-press/models/book/Chapter";
                    import Chapter from '$lib/components/page/Chapter.svelte';
                    import { getEdition } from '$lib/components/page/Contexts';

                    const edition = getEdition();
                    const chapter = $edition?.getChapter($page.params.chapterid);
                </script>t
            
                <Chapter {chapter} />
            `
            );
        }

        // Create a book.json file based on the book and edition data
        console.log('Writing edition content to book folder...');
        fs.writeFileSync(
            'src/lib/assets/book.json',
            JSON.stringify(editionJSON, null, 2)
        );

        // Build the site
        try {
            console.log('Building book...');
            await exec('npm', ['run', 'build']);
        } catch (error) {
            console.log(`Problem building book: ${error}`);
            return error;
        }

        // Upload everything to Firebase Hosting at the appropriate URL

        /**
         *
         * TODO I stopped here. Here's the proper API:
         *
         * https://firebase.google.com/docs/hosting/api-deploy.
         *
         * And unfortunately the API is still beta. It also has some dev ops complexities
         * such as requiring hitting a live API (no emulation support), some risks about
         * app deploys clobbering books. For now, I'm just going to serve books
         * out of the database, which is less performant and more expensive, but less complex
         * and therefore more maintainable.
         *
         */

        console.log('Successfully published!');

        return undefined;
    }
);
