import React, { ChangeEvent, useContext, useState } from 'react';
import { Position } from '../../models/chapter/Position';
import PositionEditor from "./PositionEditor";
import { EmbedNode } from '../../models/chapter/EmbedNode';
import URLEditor from './URLEditor';
import { CaretContext, CaretContextType } from './BookishEditor';
import TextEditor from './TextEditor';
import { Spacer } from './Toolbar';
import { storage } from '../../models/Firebase';
import { EditorContext } from '../page/Edition';
import { Image } from '../../models/book/BookMedia';

const ImageChooser = (props: { images: Image[], select: (image: Image) => void}) => {

    return <div className="bookish-image-chooser">
        {
            props.images === undefined ? <span>Loading images</span> :
            props.images.length === 0 ? <span>No images uplaoded.</span> :
            props.images.map(image => 
                <img 
                    className="bookish-image-chooser-image" 
                    key={image.url}
                    src={image.url} 
                    alt={image.description} 
                    onClick={() => props.select.call(undefined, image)}
                />)
        }
        </div>

}

const EmbedEditor = (props: {
    embed: EmbedNode
}) => {

    const embed = props.embed;
    const description = embed.getDescription();
    const caret = useContext<CaretContextType>(CaretContext);
    const { edition } = useContext(EditorContext);
    const [ upload, setUpload ] = useState<undefined|number|string>(undefined);

    const media = edition?.getBook()?.getMedia();

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
        const media = edition?.getBook()?.getMedia();

        if(file === undefined) return;
        if(storage === undefined) return;
        if(media === undefined) return;

        media.upload(file, 
            (progress: number) => setUpload(`${progress}% done`),
            (error: string) => setUpload(error),
            (url: string, thumbnail: string) => {
                // Upload completed successfully, now we can get the download URL
                caret?.edit(embed, embed.withURLs(url, thumbnail).withDescription(""));
                setUpload(undefined);
            }
        );
    }

    function handleImageSelection(image: Image) {
        caret?.edit(embed, embed.withURL(image.url).withDescription(image.description));
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
            {
                !embed.isHosted() ? 
                    <URLEditor 
                    url={embed.getURL()} 
                    validator={isValidURL}
                    edit={(url: string) => caret?.edit(embed, embed.withURL(url))}
                    /> :
                null
            }
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
        <Spacer/>
        <span>{upload}</span>
        { media === undefined ? null : <ImageChooser images={media.getImages()} select={handleImageSelection} /> }
    </>

}

export default EmbedEditor;