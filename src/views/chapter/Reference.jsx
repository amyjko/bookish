import React from 'react'

function Reference(props) {

    const { node, context, key } = props

    // If a short version was requested, try to abbreviate the authors.
    if(node.short) {
        let authors = node.authors.split(",");
        if(authors.length === 1) {
            authors = authors[0];
        }
        else if(authors.length === 2) {
            authors = authors[0].trim() + " & " + authors[1].trim();
        }
        else {
            authors = authors[0].trim() + ", et al.";
        }
        return <span className="reference-text">{authors} ({node.year}). {node.url === null ? node.title : <a href={node.url} target={"_blank"}>{node.title}</a>}{node.title.charAt(node.title.length - 1) === "?" ? "" : "."} <em>{node.source}</em></span>
    }
    else
        return <span className="reference-text">{node.authors} ({node.year}). {node.url === null ? node.title : <a href={node.url} target={"_blank"}>{node.title}</a>}{node.title.charAt(node.title.length - 1) === "?" ? "" : "."} <em>{node.source}</em>.{node.summary ? <span className="summary">{node.summary}</span> : null }</span>
    
}

export default Reference