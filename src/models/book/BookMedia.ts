import { getDownloadURL, listAll, ref, uploadBytesResumable } from "firebase/storage";
import Book from "./Book";
import { v4 as uuidv4 } from 'uuid';
import { storage } from "../Firebase";

export type Image = {
    url: string,
    description: string
}

export default class BookMedia {

    readonly book: Book;
    _images: Image[];

    constructor(book: Book) {

        this.book = book;
        this._images = [];

        this.cacheImages();

    }

    getImages(): Image[] { return this._images; }

    getImagePath() { return `images/${this.book.getRefID()}/`; }

    /** Get a listing of all of the images for the book. */
    cacheImages() {

        if(storage === undefined) return;

        this._images = [];

        // Create a reference under which you want to list
        const listRef = ref(storage, this.getImagePath());

        // Find all the prefixes and items.
        listAll(listRef)
        .then((res) => {
            // We don't have subdirectories of images, but in case we do, here's how to track them.
            res.items.forEach((itemRef) => {
                getDownloadURL(itemRef).then((url) => {
                    if(this._images !== undefined)
                        this._images.push({ url: url, description: "" });
                })
            });
        }).catch((error) => {
            console.error("Unable to retrieve book images from Firebase Storage.");
            console.error(error);
        });
    }
    
    upload(file: File, progressHandler: (progress: number) => void, errorHandler: (message:string) => void, finishedHandler: (url: string) => void) {

        if(storage === undefined) return;

        // The canonical path format for Bookish images in the store is image/{bookid}/{imageid}
        // where {bookid} is the Firestore ID of the book being edited and {imageid} is just a random id.
        const images = ref(storage, `${this.getImagePath()}/${uuidv4()}`);
        const uploadTask = uploadBytesResumable(images, file);
        uploadTask.on("state_changed",
            (snapshot) => progressHandler.call(undefined, Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
            // https://firebase.google.com/docs/storage/web/handle-errors
            (error) => errorHandler.call(undefined, 
                    error.code === "storage/unauthorized" ? "Wrong permissions to upload" :
                    error.code === "storage/canceled" ? "Upload canceled" :                    
                    error.code === "storage/quota-exceeded" ? "Storage limit reached" :
                    error.code === "storage/unauthenticated" ? "Log in again to upload" :
                    "Unknown upload error"
                ), 
            () => getDownloadURL(uploadTask.snapshot.ref).then((url) => {
                finishedHandler.call(undefined, url);
                this._images.push({ url: url, description: "" })
            })
        );
    }

}