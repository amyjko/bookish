import React, { ChangeEvent, useState } from 'react';
import { Position } from '../../models/Position';
import PositionEditor from "./PositionEditor";
import { EmbedNode } from '../../models/EmbedNode';
import URLEditor from './URLEditor';

const EmbedEditor = (props: {
    embed: EmbedNode
}) => {

    const embed = props.embed;
    const description = embed.getDescription();

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
        // TODO Immutable
        embed.withDescription(e.target.value);
    }

    // TODO Immutable: setPosition, setURL
    return <>
        Position <PositionEditor value={embed.getPosition()} edit={(position: string) => embed.withPosition(position as Position)} />
        URL <URLEditor url={embed.getURL()} valid={isValidURL(embed.getURL())} edit={(url: string) => embed.withURL(url)} />
        Description <input
            type="text"
            value={description}
            placeholder="Describe the image or video for people who can't see it"
            onChange={handleDescriptionChange}
        />
    </>

}

export default EmbedEditor;