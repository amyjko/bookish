import React from 'react'
import { ReferenceNode } from '../../models/Parser';

const Reference = (props: { node: ReferenceNode }) => {

    const { node } = props

    // If a short version was requested, try to abbreviate the authors.
    if(node.short) {
        let authorList: string[] = node.authors.split(",");
        let authors: string;
        if(authorList.length === 1) {
            authors = authorList[0];
        }
        else if(authorList.length === 2) {
            authors = authorList[0].trim() + " & " + authorList[1].trim();
        }
        else {
            authors = authorList[0].trim() + ", et al.";
        }
        return <span className="bookish-reference-text">{authors} ({node.year}). {node.url === null ? node.title : <a href={node.url} target={"_blank"}>{node.title}</a>}{node.title.charAt(node.title.length - 1) === "?" ? "" : "."} <em>{node.source}</em></span>
    }
    else
        return <span className="bookish-reference-text">{node.authors} ({node.year}). {node.url === null ? node.title : <a href={node.url} target={"_blank"}>{node.title}</a>}{node.title.charAt(node.title.length - 1) === "?" ? "" : "."} <em>{node.source}</em>.{node.summary ? <span className="bookish-reference-summary">{node.summary}</span> : null }</span>
    
}

export default Reference