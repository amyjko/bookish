import React, { useEffect, useState } from 'react'
import { Position } from '../../models/Parser';

const PositionEditor = (props: { 
    position: Position,
    edit : (position: Position) => void
}) => {

    const { position, edit } = props;
 
    function handleClick(event: React.MouseEvent) {

        // Don't let anything else handle the click.
        event.stopPropagation();
        const newPosition = (event.currentTarget as HTMLElement).dataset.position;
        if(newPosition === "<" || newPosition === "|" || newPosition === ">") {
            edit.call(undefined, newPosition);
        }

    }

    return <div className={`bookish-app-position-editor`}>
        <span className={`bookish-app-position ${position === "<" ? "bookish-app-position-selected" : ""}`} data-position={"<"} onClick={handleClick}>&lt;</span>
        <span className={`bookish-app-position ${position === "|" ? "bookish-app-position-selected" : ""}`} data-position={"|"} onClick={handleClick}>|</span>
        <span className={`bookish-app-position ${position === ">" ? "bookish-app-position-selected" : ""}`} data-position={">"} onClick={handleClick}>&gt;</span>
    </div>

}

export default PositionEditor;