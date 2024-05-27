import { onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import {
    onObjectFinalized,
    onObjectDeleted,
} from 'firebase-functions/v2/storage';
import admin from 'firebase-admin';
import path from 'path';
import os from 'os';
import fs from 'fs';
import sharp from 'sharp';

admin.initializeApp();

/** When a file is created in the project's storage bucket, see if it's a non-thumbnail image, and if so, create a thumnail for it. */
export const createThumbnailGen2 = onObjectFinalized(
    async ({ data: object }) => {
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
    },
);

/** When a file is deleted, see if it's a non-thumnail image, and if so, delete it's corresponding thumbnail from storage. */
export const deleteThumbnailGen2 = onObjectDeleted(async ({ data: object }) => {
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

export const getUserEmailsGen2 = onCall<
    { uids: string[] },
    Promise<Record<string, string>>
>(async ({ data }) => {
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
});

export const createUserWithEmailGen2 = onCall<
    { email: string },
    Promise<string | null>
>(async ({ data }) => {
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
});

export const backupGen2 = onSchedule('every 24 hours', async (event) => {
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
        outputUriPrefix: `gs://${bucket.name}/backup/${event.scheduleTime}`,
        collectionIds: [],
    });
    console.log('Done exporting database');
});

/** Helper function for getting the project ID. */
function getProjectID() {
    return process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
}

/** Helper function to ensure consistent formatting of thumbnail locations. */
function getThumbnailPath(filePath: string) {
    const fileName = path.basename(filePath);
    const thumbFileName = `${fileName}`;
    return path.join(path.dirname(filePath), 'thumbnails/', thumbFileName);
}

/** Helper function for resizing an image in a storage bucket. */
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
