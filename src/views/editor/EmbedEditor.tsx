import React, { ChangeEvent, useContext, useState } from 'react';
import { Position } from '../../models/Position';
import PositionEditor from "./PositionEditor";
import { EmbedNode } from '../../models/EmbedNode';
import URLEditor from './URLEditor';
import { CaretContext, CaretContextType } from './BookishEditor';
import TextEditor from './TextEditor';
import { Spacer } from './Toolbar';

const EmbedEditor = (props: {
    embed: EmbedNode
}) => {

    const embed = props.embed;
    const description = embed.getDescription();
    const caret = useContext<CaretContextType>(CaretContext);

    function isValidURL(url: string): string | undefined {
        // Is it a valid URL?
        try {
            let test = new URL(url);
            if(test.protocol === "http:" || test.protocol === "https:")
                return;
        } catch (_) {}
        return "URL doesn't seem valid";
    }

    const positionEditor = 
        caret?.root instanceof EmbedNode ? 
            null : 
            <>Position <PositionEditor value={embed.getPosition()} edit={(position: string) => caret?.edit(embed, embed.withPosition(position as Position)) } /></>

    return <>
        { positionEditor }
        { positionEditor !== null ? <Spacer/> : null }
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
    </>

}

export default EmbedEditor;