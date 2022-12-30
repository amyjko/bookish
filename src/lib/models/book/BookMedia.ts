import type { StorageReference } from 'firebase/storage';
import {
    deleteObject,
    getDownloadURL,
    listAll,
    ref,
    uploadBytes,
} from 'firebase/storage';
import type Book from './Book';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../Firebase';

export type Image = {
    url: string;
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
        return `images/${this.book.getRefID()}/`;
    }

    /** Get a listing of all of the images for the book. */
    async cacheImages(): Promise<Image[]> {
        if (storage === undefined) return [];

        // Find all the prefixes and items.
        this._images = (await this.retrieveImages()).filter(
            (image) => image !== undefined
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
                            url: url,
                            description: '',
                            ref: itemRef,
                        };
                        if (this._images !== undefined) {
                            this._images.push(image);
                        }
                        return image;
                    })
                )
            )
        );
    }

    getThumbnailURL(
        url: string,
        thumbnailRef: StorageReference,
        error: (message: string) => void,
        finished: (url: string, thumbnailURL: string) => void,
        attempt = 0
    ) {
        getDownloadURL(thumbnailRef)
            .then((thumbnail) => finished(url, thumbnail))
            // Try again in a bit.
            .catch(() =>
                attempt > 10
                    ? error("Couldn't upload image")
                    : setTimeout(
                          () =>
                              this.getThumbnailURL(
                                  url,
                                  thumbnailRef,
                                  error,
                                  finished,
                                  attempt + 1
                              ),
                          250
                      )
            );
    }

    upload(
        file: File,
        progressHandler: (progress: number) => void,
        errorHandler: (message: string) => void,
        finishedHandler: (url: string, thumbnailURL: string) => void
    ) {
        progressHandler;

        if (storage === undefined) return;

        // The canonical path format for Bookish images in the store is image/{bookid}/{imageid}
        // where {bookid} is the Firestore ID of the book being edited and {imageid} is just a random id.
        const imageName = `image-${uuidv4()}`;
        const imageRef = ref(storage, `${this.getImagePath()}/${imageName}`);
        const thumbnailRef = ref(
            storage,
            `${this.getImagePath()}/thumbnails/${imageName}`
        );

        uploadBytes(imageRef, file)
            .then((snapshot) => {
                getDownloadURL(snapshot.ref)
                    .then((url) => {
                        // Give some time for the cloud function to create a thumbnail, then try to get it's URL.
                        setTimeout(
                            () =>
                                this.getThumbnailURL(
                                    url,
                                    thumbnailRef,
                                    errorHandler,
                                    finishedHandler
                                ),
                            250
                        );
                    })
                    .catch(() => errorHandler('Unable to get image URL.'));
            })
            .then(() => this.cacheImages());

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
