import * as functions from "firebase-functions";
import { ObjectMetadata } from "firebase-functions/v1/storage";

const admin = require("firebase-admin");
const spawn = require('child-process-promise').spawn;
const path = require("path");
const os = require("os");
const fs = require("fs");

admin.initializeApp();

function getThumbnailPath(filePath: string) {

    const fileName = path.basename(filePath);
    const thumbFileName = `${fileName}`;
    return path.join(path.dirname(filePath), "thumbnails/", thumbFileName);

}

async function resizeImage(filePath: string, bucketID: string, contentType: string | undefined) {

    const fileName = path.basename(filePath);

    // Download file from bucket into a temporary location.
    const bucket = admin.storage().bucket(bucketID);
    const tempFilePath = path.join(os.tmpdir(), fileName);
    console.log('Downloading image to', tempFilePath);
    
    await bucket.file(filePath).download({destination: tempFilePath});

    // Generate a thumbnail using ImageMagick, which is installed by default in Google Cloud.
    // Note: to test locally, ImageMagick has to be installed locally.
    // If you're getting "Error: spawn convert ENOENT" when using the emu.ator, it's because it's not
    // installed locally. On mac OS, "brew install imagemagick" should suffice.
    console.log('Resizing downloaded image...');
    await spawn('convert', [tempFilePath, '-thumbnail', '320x320>', tempFilePath]);

    const thumbFilePath = getThumbnailPath(filePath);

    console.log('Uploading resized image to ', thumbFilePath);

    // Uploading the thumbnail.
    await bucket.upload(tempFilePath, {
        destination: thumbFilePath,
        metadata: { contentType: contentType }
    });
    
    // Once the thumbnail has been uploaded delete the local file to free up disk space.
    return await fs.unlinkSync(tempFilePath);

}

export const createThumbnail = functions.storage.object().onFinalize(async (object: ObjectMetadata) => {

    if(object.name === undefined) {
        console.log("Unknown file uplaoded.");
        return;
    }
    if(!object.name.startsWith("images/")) {
        console.log("Non-image uploaded, ignoring");
        return;
    }
    if(object.name.includes("thumbnails/")) {
        console.log("Thumbnail uploaded, ignoring.");
        return;
    }

    return resizeImage(object.name, object.bucket, object.contentType);

});

export const deleteThumbnail = functions.storage.object().onDelete(async (object: ObjectMetadata) => {

    if(object.name === undefined) {
        console.log("Unknown file uplaoded.");
        return;
    }
    if(!object.name.startsWith("images/")) {
        console.log("Non-image deleted, ignoring");
        return;
    }
    if(object.name.includes("thumbnails/")) {
        console.log("Thumbnail deleted, ignoring.");
        return;
    }

    // Download file from bucket into a temporary location.
    const bucket = admin.storage().bucket(object.bucket);    
    const thumbFilePath = getThumbnailPath(object.name);

    console.log(`Deleting ${thumbFilePath}`);

    return await bucket.file(thumbFilePath).delete();

});