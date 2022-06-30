import React, { useContext } from 'react'
import { ReferenceNode } from "../../models/ReferenceNode";
import TextEditor from '../editor/TextEditor';
import { EditorContext } from '../page/Book';

const Reference = (props: { node: ReferenceNode }) => {

    const { node } = props;
    const { editable, book } = useContext(EditorContext);

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
        return <span data-nodeid={props.node.nodeID} className="bookish-reference-text">{authors} ({node.year}). {node.url === null ? node.title : <a href={node.url} target={"_blank"}>{node.title}</a>}{node.title.charAt(node.title.length - 1) === "?" ? "" : "."} <em>{node.source}</em></span>
    }
    else {

        const id =
            editable && book ?
                <TextEditor
                    text={node.citationID} 
                    label={'Citation ID editor.'} 
                    save={text => book.editReferenceID(text, node)}
                >
                    <span className="bookish-editor-note">{node.citationID}</span>
                </TextEditor>
                :
                null // Don't show the ID when not editing

        const authorsRender = node.authors || <em>Authors</em>;
        const authors =
            editable && book ?
                <TextEditor
                    text={node.authors} 
                    label={'Author list editor.'} 
                    save={text => book.editReference(node.withAuthors(text))}
                >
                    { authorsRender }
                </TextEditor>
                :
                authorsRender

        const yearRender = node.year || <em>Year</em>;
        const year =
            editable && book ?
                <TextEditor
                    text={node.year} 
                    label={'Year editor.'} 
                    save={text => book.editReference(node.withYear(text))}
                >
                    {yearRender}
                </TextEditor>
                :
                yearRender

        const titleRender = node.url === null ? node.title || <em>Title</em> : <a href={node.url} target={"_blank"}>{node.title || <em>Title</em>}</a>;
        const title =
            editable && book ?
                <TextEditor
                    text={node.title} 
                    label={'Title editor.'} 
                    save={text => book.editReference(node.withTitle(text))}
                >
                    {titleRender}
                </TextEditor>
                :
                titleRender
        
        const sourceRender = <em>{node.source || "Source"}</em>
        const source =
            editable && book ?
                <TextEditor
                    text={node.source} 
                    label={'Source editor.'} 
                    save={text => book.editReference(node.withSource(text))}
                >
                    {sourceRender}
                </TextEditor>
                :
                { sourceRender}

        const summary =
            editable && book ?
                <TextEditor
                    text={node.summary} 
                    label={'Summary editor.'} 
                    save={text => book.editReference(node.withSummary(text))}
                >
                    {node.summary}
                </TextEditor>
                :
                node.summary ? <span className="bookish-reference-summary">{node.summary}</span> : null
    
        return <span data-nodeid={props.node.nodeID} className="bookish-reference-text">
            {authors} ({year}). {title}. {source}. {summary} { id ? <><br/>{id}</> : null } 
        </span>

    }
    
}

export default Reference;