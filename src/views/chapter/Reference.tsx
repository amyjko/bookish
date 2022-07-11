import React, { useContext } from 'react'
import { ReferenceNode } from "../../models/chapter/ReferenceNode";
import TextEditor from '../editor/TextEditor';
import { EditorContext } from '../page/Edition';

const Reference = (props: { node: ReferenceNode }) => {

    const { node } = props;
    const { editable, edition: book } = useContext(EditorContext);

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

        const authors =
            editable && book ?
                <em>
                    <TextEditor
                        text={node.authors} 
                        label={'Author list editor.'}
                        placeholder="Authors"
                        valid={ text => {
                            if(text.length === 0) return "Authors can't be empty.";
                        }}
                        save={text => book.editReference(node.withAuthors(text))}
                        width={60}
                    />
                </em>
                :
                node.authors || <em>Authors</em>;

        const year =
            editable && book ?
                <TextEditor
                    text={node.year} 
                    label={'Year editor.'} 
                    placeholder="Year"
                    valid={ text => {
                        if(text.length === 0) return "Year can't be empty";
                        if(!/1?[0-9)[0-9]{2}/.test(text)) return "Not a valid year"
                    }}
                    save={text => book.editReference(node.withYear(text))}
                />
                :
                node.year || <em>Year</em>

        const title =
            editable && book ?
                <TextEditor
                    text={node.title} 
                    label={'Title editor.'} 
                    placeholder="Title"
                    valid={ text => {
                        if(text.length === 0) return "Title can't be empty.";
                    }}
                    save={text => book.editReference(node.withTitle(text))}
                    width={60}
                />
                :
                node.url === null ? node.title || <em>Title</em> : <a href={node.url} target={"_blank"}>{node.title || <em>Title</em>}</a>
        
        const source =
            editable && book ?
                <em>
                    <TextEditor
                        text={node.source}
                        label={'Source editor.'} 
                        placeholder="Source"
                        valid={ text => {
                            if(text.length === 0) return "Source can't be empty";
                        }}
                        save={text => book.editReference(node.withSource(text))}
                        width={60}
                    />
                </em>
                :
                <em>{node.source || "Source"}</em>

        const summary =
            editable && book ?
                <TextEditor
                    text={node.summary} 
                    label={'Summary editor.'} 
                    placeholder="Summary"
                    valid={ text => undefined }
                    save={text => book.editReference(node.withSummary(text))}
                    width={60}
                />
                :
                node.summary ? <span className="bookish-reference-summary">{node.summary}</span> : null
    
        return editable ?
            // If editable, place in rows to make room for text editors to not have to wrap.
            <span data-nodeid={props.node.nodeID} className="bookish-reference-text">
                {authors} ({year})
                <br/>{title}
                <br/>{source}
                <br/>{summary}
            </span> :
            <span data-nodeid={props.node.nodeID} className="bookish-reference-text">
                {authors} ({year}). {title}. {source}. {summary}
            </span>

    }
    
}

export default Reference;