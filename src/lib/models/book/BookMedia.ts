import type { StorageReference } from 'firebase/storage';
import {
    deleteObject,
    getDownloadURL,
    listAll,
    ref,
    uploadBytes,
} from 'firebase/storage';
import type Book from './Book';
import { storage } from '../Firebase';
import { v4 as uuidv4 } from 'uuid';

export type Image = {
    url: string;
    thumb: string;
    ref: StorageReference;
};

export default class BookMedia {
    readonly book: Book;
    _images: Image[] | undefined;

    // A list of functions to call when the book media changes.
    readonly observers: Set<(images: Image[]) => void> = new Set();

    constructor(book: Book) {
        this.book = book;
    }

    notify(observer: (images: Image[]) => void) {
        this.observers.add(observer);
        // Notify it right away!
        this.getImages().then((images) => observer(images));
    }

    stopNotifying(observer: (images: Image[]) => void) {
        this.observers.delete(observer);
    }

    /** Get all non-thumbnail images. */
    async getImages(): Promise<Image[]> {
        return this._images === undefined ? this.cacheImages() : this._images;
    }

    getImagePath() {
        return `images/${this.book.getID()}/`;
    }

    /** Get a listing of all of the images for the book. */
    async cacheImages(): Promise<Image[]> {
        if (storage === undefined) return [];

        // Find all the prefixes and items.
        this._images = (await this.retrieveImages()).filter(
            (image) => image !== undefined,
        ) as Image[];

        // Notify observers
        for (const observer of this.observers) observer(this._images.slice());

        return this._images;
    }

    async retrieveImages(): Promise<(Image | undefined)[]> {
        if (storage === undefined) return [];

        // Create a reference under which you want to list
        const listRef = ref(storage, this.getImagePath());

        // Find all the prefixes and items.
        return listAll(listRef).then((res) =>
            Promise.all(
                res.items.map((itemRef) =>
                    getDownloadURL(itemRef).then((url) => {
                        const image = {
                            url,
                            thumb: this.makeThumbnailURL(url),
                            description: '',
                            ref: itemRef,
                        };
                        if (this._images !== undefined) {
                            this._images.push(image);
                        }
                        return image;
                    }),
                ),
            ),
        );
    }

    stripTokenFromURL(url: string) {
        const tokenIndex = url.indexOf('&token=');
        return tokenIndex >= 0 ? (url = url.substring(0, tokenIndex)) : url;
    }

    // Construct a thumbnail URL from the base URL.
    makeThumbnailURL(url: string) {
        // The structure of the URL is
        // https://[firebase-domain]/v0/b/[projectid].appspot.com/o/images%2F[bookID]%2F[imagename]?alt=media
        // And we want
        // https://[firebase-domain]/v0/b/[projectid].appspot.com/o/images%2F[bookID]%2Fthumbnails%2F[imagename]?alt=media
        const bookID = this.book.getID();
        const bookIDIndex = url.indexOf(bookID);
        return bookIDIndex >= 0
            ? `${url.substring(
                  0,
                  bookIDIndex,
              )}${bookID}%2Fthumbnails${url.substring(
                  bookIDIndex + bookID.length,
              )}`
            : url;
    }

    getThumbnailURL(
        url: string,
        thumbnailRef: StorageReference,
        error: (message: string) => void,
        finished: (url: string, thumbnailURL: string) => void,
        attempt = 0,
    ) {
        getDownloadURL(thumbnailRef)
            .then((thumbnail) => finished(url, thumbnail))
            // Try again in a bit.
            .catch(() =>
                attempt > 25
                    ? error("Couldn't get the image's thumbnail URL")
                    : setTimeout(
                          () =>
                              this.getThumbnailURL(
                                  url,
                                  thumbnailRef,
                                  error,
                                  finished,
                                  attempt + 1,
                              ),
                          200,
                      ),
            );
    }

    upload(
        file: File,
        _: (progress: number) => void,
        errorHandler: (message: string) => void,
        finishedHandler: (url: string, thumbnailURL: string) => void,
    ) {
        if (storage === undefined) return;

        // Get the extension if there is one.
        const [name, extension] = file.name.split('.');

        // We use the file name given, but append a unique string to avoid collisions.
        const imageName = `${name}-${uuidv4()}.${extension ?? ''}`;
        // The canonical path format for Bookish images in the store is image/{bookid}/{imageid}
        // where {bookid} is the Firestore document ID of the book being edited and {imageid} is just a random id.
        const imageRef = ref(storage, `${this.getImagePath()}/${imageName}`);

        uploadBytes(imageRef, file)
            .then((snapshot) => {
                getDownloadURL(snapshot.ref)
                    // After we get the download URL for the uploaded image,
                    // try to get the thumbnail URL for the resized image on the server.
                    .then((url) =>
                        finishedHandler(
                            this.stripTokenFromURL(url),
                            this.makeThumbnailURL(this.stripTokenFromURL(url)),
                        ),
                    )
                    .catch((error) => {
                        console.error(error);
                        errorHandler('Unable to get image URL.');
                    });
            })
            .then(() => this.cacheImages())
            .catch((error) => {
                console.error(error);
                errorHandler('Unable to upload image.');
            });

        // This seems to be broken in Firebase right now. Switched above to a no-feedback approach.
        // const uploadTask = uploadBytesResumable(imageRef, file);
        // uploadTask.on("state_changed",
        //     // During upload, notify of progress by sending an integer percent complete.
        //     (snapshot) => progressHandler(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
        //     // If there's an error, map it to a message.
        //     // https://firebase.google.com/docs/storage/web/handle-errors
        //     (error) => {
        //         console.error(error);
        //         errorHandler(
        //             error.code === "storage/unauthorized" ? "Wrong permissions to upload" :
        //             error.code === "storage/canceled" ? "Upload canceled" :
        //             error.code === "storage/quota-exceeded" ? "Storage limit reached" :
        //             error.code === "storage/unauthenticated" ? "Log in again to upload" :
        //             "Unknown upload error"
        //         )
        //     },
    }

    async remove(image: Image) {
        if (storage === undefined) return;

        const imageRef = ref(storage, image.ref.fullPath);
        await deleteObject(imageRef);

        return await this.cacheImages();
    }
}
