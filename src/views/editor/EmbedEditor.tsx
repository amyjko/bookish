import React, { ChangeEvent, useContext, useState } from 'react';
import { Position } from '../../models/Position';
import PositionEditor from "./PositionEditor";
import { EmbedNode } from '../../models/EmbedNode';
import URLEditor from './URLEditor';
import { CaretContext, CaretContextType } from './ChapterEditor';

const EmbedEditor = (props: {
    embed: EmbedNode
}) => {

    const embed = props.embed;
    const description = embed.getDescription();
    const caret = useContext<CaretContextType>(CaretContext);

    function isValidURL(url: string): boolean {
        // Is it a valid URL?
        try {
            let test = new URL(url);
            if(test.protocol === "http:" || test.protocol === "https:")
                return true;
        } catch (_) {}
        return false;
    }

    function handleDescriptionChange(e: ChangeEvent<HTMLInputElement>) {
        caret?.edit(embed, embed.withDescription(e.target.value));
    }

    return <>
        Position <PositionEditor value={embed.getPosition()} edit={(position: string) => caret?.edit(embed, embed.withPosition(position as Position)) } />
        URL <URLEditor url={embed.getURL()} valid={isValidURL(embed.getURL())} edit={(url: string) => caret?.edit(embed, embed.withURL(url))} />
        Description <input
            type="text"
            value={description}
            placeholder="Describe the image or video for people who can't see it"
            onChange={handleDescriptionChange}
        />
    </>

}

export default EmbedEditor;