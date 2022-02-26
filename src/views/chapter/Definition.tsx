import React, { useContext } from 'react'
import Marginal  from './Marginal'
import { renderNode } from './Renderer'
import Parser from '../../models/Parser'
import { DefinitionNode } from "../../models/DefinitionNode"
import { ChapterContext, ChapterContextType } from './Chapter'

const Definition = (props: { node: DefinitionNode}) => {

    const { node } = props
    const glossaryID = node.getMeta();
    const phrase = node.getText();
    const context = useContext<ChapterContextType>(ChapterContext)

    // If there's no context, render nothing.
    if(!context || !context.book)
        return <></>

    // Find the definition.
    let glossary = context.book.getGlossary();

    // Error if there's no corresponding entry.
    if(!(glossaryID in glossary))
        return <span className="bookish-error">Unknown glossary entry "{ glossaryID }"</span>

    let entry = glossary[glossaryID];

    return <span className="bookish-definition" data-nodeid={props.node.nodeID}>
        <Marginal
            id={"glossary-" + glossaryID}
            interactor={renderNode(phrase)}
            content={
                <span className="bookish-definition-entry">
                    <strong className="bookish-definition-entry-phrase">{entry.phrase}</strong>: { renderNode(Parser.parseContent(context.book, entry.definition), "definition") }
                    {
                        entry.synonyms && entry.synonyms.length > 0 ? <span className="bookish-definition-entry-synonyms"><br/><br/>{entry.synonyms.join(", ")}</span> : null
                    }
                </span>
            }
        />
    </span>


}

export default Definition