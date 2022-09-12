import React, { ChangeEvent, useContext, useState } from 'react';
import { Position } from '../../models/chapter/Position';
import PositionEditor from "./PositionEditor";
import { EmbedNode } from '../../models/chapter/EmbedNode';
import URLEditor from './URLEditor';
import { CaretContext, CaretContextType } from './BookishEditor';
import TextEditor from './TextEditor';
import { Spacer } from './Toolbar';
import { storage } from '../../models/Firebase';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { EditorContext } from '../page/Edition';
import { v4 as uuidv4 } from 'uuid';

const EmbedEditor = (props: {
    embed: EmbedNode
}) => {

    const embed = props.embed;
    const description = embed.getDescription();
    const caret = useContext<CaretContextType>(CaretContext);
    const { edition } = useContext(EditorContext);
    const [ upload, setUpload ] = useState<undefined|number|string>(undefined);

    function isValidURL(url: string): string | undefined {
        // Is it a valid URL?
        try {
            let test = new URL(url);
            if(test.protocol === "http:" || test.protocol === "https:")
                return;
        } catch (_) {}
        return "URL doesn't seem valid";
    }

    function handleImageChange(event: ChangeEvent<HTMLInputElement>) {

        const file = event.target.files === null ? undefined : event.target.files[0];

        if(file === undefined) return;
        if(storage === undefined) return;
        if(edition === undefined) return;

        // The canonical path format for Bookish images in the store is image/{bookid}/{imageid}
        // where {bookid} is the Firestore ID of the book being edited and {imageid} is just a random id.
        const images = ref(storage, `images/${edition.getBook()?.getRefID()}/${uuidv4()}`);
        const uploadTask = uploadBytesResumable(images, file);
        uploadTask.on("state_changed",
            (snapshot) => {
                // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                setUpload(`${Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)}% done${snapshot.state === "paused" ? "; paused" : ""}`);
            }, 
            (error) => {
                // https://firebase.google.com/docs/storage/web/handle-errors
                setUpload(
                    error.code === "storage/unauthorized" ? "Wrong permissions to upload" :
                    error.code === "storage/canceled" ? "Upload canceled" :                    
                    error.code === "storage/quota-exceeded" ? "Storage limit reached" :
                    error.code === "storage/unauthenticated" ? "Log in again to upload" :
                    "Unknown upload error"
                );
            }, 
            () => {
                // Upload completed successfully, now we can get the download URL
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    caret?.edit(embed, embed.withURL(downloadURL).withDescription(""));
                });
                setUpload(undefined);
            }
        );
    }

    const positionEditor = 
        caret?.root instanceof EmbedNode ? 
            null : 
            <>Position <PositionEditor value={embed.getPosition()} edit={(position: string) => caret?.edit(embed, embed.withPosition(position as Position)) } /></>
            
    return <>
        { positionEditor }
        { positionEditor !== null ? <Spacer/> : null }
        <label className="bookish-file-upload"><input type="file" onChange={handleImageChange} accept=".jpg,.jpeg,.png,.gif,image/jpeg,image/png,image/gif"/>Upload</label>
        <Spacer/>
        <code>
            <URLEditor 
                url={embed.getURL()} 
                validator={isValidURL} 
                edit={(url: string) => caret?.edit(embed, embed.withURL(url))} 
            />
        </code>
        <Spacer/>
        <code>
            <TextEditor
                text={description} 
                label={'Image description'} 
                placeholder={'description'} 
                valid={ alt => {
                    if(alt.length === 0) return "Image description required";
                }}
                save={ alt => { caret?.edit(embed, embed.withDescription(alt)); } }
                width={20}
                clip={true}
            />
        </code>
        <span>{upload}</span>
    </>

}

export default EmbedEditor;