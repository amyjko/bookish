import functions from 'firebase-functions';
import { ObjectMetadata } from 'firebase-functions/v1/storage';
import admin from 'firebase-admin';
import path from 'path';
import os from 'os';
import fs from 'fs';
import sharp from 'sharp';

admin.initializeApp();

function getThumbnailPath(filePath: string) {
    const fileName = path.basename(filePath);
    const thumbFileName = `${fileName}`;
    return path.join(path.dirname(filePath), 'thumbnails/', thumbFileName);
}

async function resizeImage(
    storagePath: string,
    bucketID: string,
    contentType: string | undefined,
) {
    // Get the bucket.
    const bucket = admin.storage().bucket(bucketID);

    // Get the path to the filename.
    const storageFileName = path.basename(storagePath);

    // Make the new image public
    await bucket.file(storagePath).makePublic();

    // Download file from bucket into a temporary location
    const downloadedImagePath = path.join(os.tmpdir(), storageFileName);
    console.log('Downloading image to', downloadedImagePath);
    await bucket
        .file(storagePath)
        .download({ destination: downloadedImagePath });

    console.log('Resize the image...');
    const resizedImagePath = `${downloadedImagePath}-small`;
    try {
        // Save over the original image
        await sharp(downloadedImagePath).resize(320).toFile(resizedImagePath);
    } catch (err) {
        console.log(`Unable to save resized image: ${err}`);
        return;
    }

    // Uploading the thumbnail and make it public.
    await bucket.upload(resizedImagePath, {
        destination: getThumbnailPath(storagePath),
        metadata: { contentType: contentType },
        public: true,
    });

    // Once the thumbnail has been uploaded delete the local file, just to keep /tmp clean.
    fs.unlinkSync(downloadedImagePath);

    return;
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

        // First, make the new image public.
        await admin
            .storage()
            .bucket(object.bucket)
            .file(object.name)
            .makePublic();

        // Then, create a thumbnail for it.
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
            }),
        );

        const map: Record<string, string> = {};
        users.users.forEach((user) => {
            map[user.uid] = user.email ?? '';
        });

        return map;
    },
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
    },
);

// export const publishEdition = functions
//     // This takes some time and some memory -- testing showed that it regularly exceeded 256 MB and >1 minute.
//     .runWith({ timeoutSeconds: 300, memory: '1GB' })
//     .https.onCall(async (data: { bookID: string; editionID: string }) => {
//         const { bookID, editionID } = data;

//         // Move to a temporary folder workspace.
//         const tempDir = os.tmpdir();
//         process.chdir(tempDir);

//         console.log(`Created temporary folder at ${tempDir}`);

//         // If there's already something in /bookish-reader, remove it all for a fresh build.
//         if (fs.existsSync('bookish-reader')) {
//             console.log('Cleaning folder to prepare for build...');
//             await execute('rm', ['-rf', 'bookish-reader']);
//         }

//         // Clone the reader repo
//         console.log('Cloning book template...');
//         await execute('git', [
//             'clone',
//             'https://github.com/amyjko/bookish-reader',
//         ]);

//         // Move inside the reader
//         console.log('Changing to book folder...');
//         process.chdir(path.join(tempDir, 'bookish-reader'));

//         // Retrieve the edition
//         console.log('Retrieving edition from database...');
//         const editionDoc = admin
//             .firestore()
//             .doc(`books/${bookID}/editions/${editionID}`);
//         const editionData = await editionDoc.get();
//         if (!editionData.exists) {
//             console.log("Couldn't get ediition from firestore, bailing.");
//             return "Unknown book edition, can't publish.";
//         }

//         const editionJSON = editionData.data() as EditionSpecification;

//         // Retrieve all edition's chapter text.
//         for (const chapter of editionJSON.chapters) {
//             console.log(
//                 `Retrieving chapter ${chapter.id} text and creating its route...`
//             );
//             if (chapter.ref === undefined) {
//                 console.log(
//                     'No chapter ID in the chapter edition metadata, bailing.'
//                 );
//                 return "Missing chapter, can't published book.";
//             }
//             const chapterPath = `books/${bookID}/editions/${editionID}/chapters/${chapter.ref.id}`;
//             const chapterData = await admin.firestore().doc(chapterPath).get();
//             if (!chapterData.exists) {
//                 console.log(`Couldn't resolve chapter "${chapterPath}"`);
//                 return "Missing chapter text, can't publish.";
//             }

//             const chapterText = chapterData.data()?.text;
//             if (chapterText === undefined) {
//                 console.log(`Found chapter data, but it had no text."`);
//                 return "Missing chapter text, can't publishing.";
//             }
//             chapter.text = chapterText;

//             // Create a route for the chapter and a page with renders its contents.
//             try {
//                 const routePath = `src/routes/${chapter.id}`;
//                 fs.mkdirSync(routePath);
//                 // Copy the +page.svelte template from the assets folder.
//                 fs.copyFileSync(
//                     `src/lib/assets/+page.svelte`,
//                     `${routePath}/+page.svelte`
//                 );
//                 console.log(`Created route for chapter ${chapter.id}`);
//             } catch (err) {
//                 console.log(err);
//                 return `Couldn't create chapter ${chapter.id} route.`;
//             }
//         }

//         // Create a book.json that stores the edition data.
//         // the bookish-reader template uses this as a state asset to
//         // render the book.
//         try {
//             console.log('Writing edition.json to assets folder...');
//             fs.writeFileSync(
//                 'src/lib/assets/edition.json',
//                 JSON.stringify(editionJSON, null, 2)
//             );
//         } catch (err) {
//             console.log(err);
//             return `Couldn't create book metadata`;
//         }

//         // Build a static version of the book for the web.
//         try {
//             console.log('Building book...');

//             await execute('npm', ['exec', 'svelte-kit', 'sync']);

//             // At this point, all of the Svelte, Sveltekit, Vite, and bookish-reader dependencies should already be installed.
//             const output = await build();

//             console.log(output);

//             console.log('Checking if build was successful...');
//             if (fs.existsSync('build')) console.log('Successfully built book.');
//             else {
//                 console.log('It was not.');
//                 console.log('Here are the files in the folder...');
//                 fs.readdirSync('.').forEach((file) => {
//                     console.log(file);
//                 });

//                 return 'Could not build book.';
//             }
//         } catch (err) {
//             console.log('Build error: ' + err);
//             return 'Could not create book.';
//         }

//         const zipFileName = 'book.zip';

//         try {
//             console.log('Zipping book for download...');
//             await zip('build', zipFileName);
//         } catch (err) {
//             console.log("Couldn't zip book: " + err);
//             return "Couldn't compress book for download";
//         }

//         let downloadURL: string | undefined = undefined;
//         const bucket = admin.storage().bucket();
//         const zipFilePath = `${bookID}/${zipFileName}`;
//         try {
//             console.log('Compressed book. Uploading to cloud for download...');

//             await bucket.upload(zipFileName, {
//                 destination: zipFilePath,
//                 metadata: { contentType: 'application/zip' },
//             });
//         } catch (err) {
//             console.log(err);
//             return "Couldn't upload the book for download.";
//         }

//         try {
//             console.log('Uploaded zip. Requesting URL for download...');
//             [downloadURL] = await bucket.file(zipFilePath).getSignedUrl({
//                 action: 'read',
//                 expires: '03-09-2491',
//             });
//         } catch (err) {
//             console.log(err);
//             return "Couldn't get the URL for the download.";
//         }
//         // Upload everything to Firebase Hosting at the appropriate URL

//         /**
//          *
//          * TODO I stopped here. Here's the proper API:
//          *
//          * https://firebase.google.com/docs/hosting/api-deploy.
//          *
//          * I got stuck on how to get an access token to call the Hosting API.
//          * I obviously can't follow the example of getting a service account key
//          * since there's no secure way to deploy one.
//          */

//         console.log('Skipped hosting deploy :(');

//         return { url: downloadURL };
//     });

/** Turn spawn into a promise for comprehensibility */
// async function execute(cmd: string, args: ReadonlyArray<string>) {
//     return new Promise<string>((resolve, reject) => {
//         try {
//             console.log(`Executing ${cmd} ${args.join(' ')}...`);
//             const process = spawn(cmd, args, { stdio: 'inherit' });
//             const error: string[] = [];
//             const stdout: string[] = [];
//             // Save each bit of standard output that comes out.
//             // process.stdout.on('data', (data) => {
//             //     stdout.push(data.toString());
//             // });

//             // // Save the errors that come
//             // process.on('error', (e) => {
//             //     error.push(e.toString());
//             // });

//             // When the process closes, resolve with the output or errors.
//             process.on('close', () => {
//                 if (error.length) reject(error.join(''));
//                 else resolve(stdout.join(''));
//             });
//         } catch (error) {
//             reject('' + error);
//         }
//     });
// }

export const backup = functions.pubsub
    .schedule('every 24 hours')
    .onRun(async (context) => {
        const client = new admin.firestore.v1.FirestoreAdminClient({});
        const projectID = getProjectID();
        if (projectID === undefined) {
            console.log('Skipping backup, no project ID.');
            return;
        }

        // Get the default bucket
        const bucket = admin.storage().bucket();

        // Get the project default database
        const database = client.databasePath(projectID, '(default)');
        console.log('Exporting database');
        // Export the documents to the default bucket, in a backup folder, with the timestamp of the scheduled event.
        await client.exportDocuments({
            name: database,
            outputUriPrefix: `gs://${bucket.name}/backup/${context.timestamp}`,
            collectionIds: [],
        });
        console.log('Done exporting database');
    });

function getProjectID() {
    return process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
}
