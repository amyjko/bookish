import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import {
    onObjectFinalized,
    onObjectDeleted,
} from 'firebase-functions/v2/storage';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore, v1 as firestoreV1 } from 'firebase-admin/firestore';
import path from 'path';
import os from 'os';
import fs from 'fs';
import sharp from 'sharp';

initializeApp();

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
        await getStorage().bucket(object.bucket).file(object.name).makePublic();

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
    const bucket = getStorage().bucket(object.bucket);
    const thumbFilePath = getThumbnailPath(object.name);

    console.log(`Deleting ${thumbFilePath}`);

    return await bucket.file(thumbFilePath).delete();
});

/**
 * Everyone who shares a book with the given user: its editors (uids), and the
 * editors of its editions and chapters. The book keeps a copy of the latter
 * (readuids), but it's only refreshed when the book itself is saved, so
 * someone just added to an edition would be missing for a while. Read the
 * editions too, which are the source of truth.
 */
async function collaboratorsOf(uid: string): Promise<Set<string>> {
    const books = getFirestore().collection('books');
    const [editing, reading] = await Promise.all([
        books.where('uids', 'array-contains', uid).get(),
        books.where('readuids', 'array-contains', uid).get(),
    ]);
    const shared = new Map(
        [...editing.docs, ...reading.docs].map((book) => [book.id, book]),
    );
    const collaborators = new Set<string>([uid]);
    const add = (ids: unknown) => {
        if (Array.isArray(ids))
            for (const id of ids)
                if (typeof id === 'string') collaborators.add(id);
    };
    await Promise.all(
        [...shared.values()].map(async (book) => {
            add(book.data().uids);
            add(book.data().readuids);
            const editions = await book.ref.collection('editions').get();
            for (const edition of editions.docs) {
                add(edition.data().uids);
                add(edition.data().chapteruids);
            }
        }),
    );
    return collaborators;
}

function requireUser(auth: { uid: string } | undefined): string {
    if (auth === undefined)
        throw new HttpsError('unauthenticated', 'Sign in first.');
    return auth.uid;
}

/**
 * Map user IDs to emails, so the editor can show who has access to a book.
 * Only signed-in users can ask, and only about people they share a book
 * with; anyone else is left out of the result.
 */
export const getUserEmailsGen2 = onCall<
    { uids: string[] },
    Promise<Record<string, string>>
>(async ({ data, auth }) => {
    const caller = requireUser(auth);
    const uids = data?.uids;
    if (
        !Array.isArray(uids) ||
        uids.length > 100 ||
        !uids.every((uid) => typeof uid === 'string')
    )
        throw new HttpsError(
            'invalid-argument',
            'Expected up to 100 user IDs.',
        );

    const collaborators = await collaboratorsOf(caller);
    const allowed = uids.filter((uid) => collaborators.has(uid));
    if (allowed.length === 0) return {};

    const users = await getAuth().getUsers(allowed.map((uid) => ({ uid })));

    const map: Record<string, string> = {};
    users.users.forEach((user) => {
        map[user.uid] = user.email ?? '';
    });

    return map;
});

/**
 * Find or create the account for an email, so an editor can give that person
 * access to a book. Only signed-in editors of at least one book can ask:
 * otherwise anyone could create accounts, or learn whether an email has one.
 */
export const createUserWithEmailGen2 = onCall<
    { email: string },
    Promise<string | null>
>(async ({ data, auth }) => {
    const caller = requireUser(auth);
    const email = data?.email;
    if (
        typeof email !== 'string' ||
        email.length > 320 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    )
        throw new HttpsError('invalid-argument', 'Expected an email address.');

    const books = getFirestore().collection('books');
    const [editing, reading] = await Promise.all([
        books.where('uids', 'array-contains', caller).limit(1).get(),
        books.where('readuids', 'array-contains', caller).limit(1).get(),
    ]);
    if (editing.empty && reading.empty)
        throw new HttpsError(
            'permission-denied',
            'Only editors of a book can add people to it.',
        );

    // First try to get the user, in case they already exist.
    try {
        const existingUser = await getAuth().getUserByEmail(email);
        return existingUser.uid;
    } catch (_) {}

    try {
        const user = await getAuth().createUser({ email });
        return user.uid;
    } catch (error) {
        console.log(error);
        return null;
    }
});

export const backupGen2 = onSchedule('every 24 hours', async (event) => {
    const client = new firestoreV1.FirestoreAdminClient({});
    const projectID = getProjectID();
    if (projectID === undefined) {
        console.log('Skipping backup, no project ID.');
        return;
    }

    // Get the default bucket
    const bucket = getStorage().bucket();

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
    const bucket = getStorage().bucket(bucketID);

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
