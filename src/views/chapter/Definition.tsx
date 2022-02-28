import React, { ChangeEvent, useContext, useEffect, useRef, useState } from 'react'
import Marginal  from './Marginal'
import { renderNode } from './Renderer'
import Parser from '../../models/Parser'
import { DefinitionNode } from "../../models/DefinitionNode"
import { ChapterContext, ChapterContextType } from './Chapter'
import Metadata from '../editor/Metadata'
import { CaretContext } from '../editor/ChapterEditor'

const Definition = (props: { node: DefinitionNode}) => {

    const { node } = props
    const glossaryID = node.getMeta();
    const phrase = node.getText();

    const caret = useContext(CaretContext);
    const context = useContext<ChapterContextType>(ChapterContext);

    const [ editedGlossaryID, setEditedGlossaryID ] = useState<string>(node.getMeta());

    const selectRef = useRef<HTMLSelectElement>(null);

    // If there's no context, render nothing.
    if(!context || !context.book)
        return <></>

    // Find the definition.
    let glossary = context.book.getGlossary();
    let entry = glossary[glossaryID];

    // Is the caret on this link?
    const focused = caret && caret.range && caret.range.start.node === node;

    useEffect(() => {
        if(focused && selectRef.current)
            selectRef.current.focus();
    }, [caret]);

    // Position the marginals on every render.
    useEffect(() => {
        if(context && context.layoutMarginals) {
            context.layoutMarginals();
        }
    });

    function handleChange(e: ChangeEvent<HTMLSelectElement>) {

        setEditedGlossaryID(e.target.value);
        node.setMeta(e.target.value);

        if(caret && caret.setCaretRange)
            caret.setCaretRange({ start: { node: node.getText(), index: 0 }, end: { node: node.getText(), index: 0 }});

    }

    const phraseView = renderNode(phrase);
    const marginalView = 
        // Error if there's no corresponding entry.
        <span className={`bookish-definition ${entry === undefined ? "bookish-error" : ""}`} data-nodeid={props.node.nodeID}>
            <Marginal
                id={"glossary-" + glossaryID}
                interactor={phraseView}
                content={
                    <span className="bookish-definition-entry">
                        { 
                            entry === undefined ? 
                                <span className="bookish-error">Unknown glossary entry "{ glossaryID }"</span> :
                                <>
                                    <strong className="bookish-definition-entry-phrase">{entry.phrase}</strong>: { renderNode(Parser.parseContent(context.book, entry.definition), "definition") }
                                    { entry.synonyms && entry.synonyms.length > 0 ? <span className="bookish-definition-entry-synonyms"><br/><br/>{entry.synonyms.join(", ")}</span> : null }
                                </>
                        }
                    </span>
                }
            />
        </span>;

    // Sort the glossary entries by phrase
    const entries = Object.keys(glossary).map(key => { return { glossaryID: key, phrase: glossary[key].phrase }; }).sort((a, b) => a.phrase.localeCompare(b.phrase));

    return <Metadata
        node={node}
        editingTextView={marginalView}
        readingTextView={marginalView}
        metaView={
            <select 
                ref={selectRef} 
                tabIndex={0} 
                value={editedGlossaryID} 
                onChange={handleChange}
            >
                <option value=""></option>
                { entries.map((entry, index) => <option key={index} value={entry.glossaryID}>{entry.phrase}</option>)}
            </select>

        }
    />


}

export default Definition