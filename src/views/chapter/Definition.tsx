import React, { useContext } from 'react'
import Marginal  from './Marginal'
import { renderNode } from './Renderer'
import Parser, { DefinitionNode } from '../../models/Parser'
import { ChapterContext, ChapterContextType } from './Chapter'

const Definition = (props: { node: DefinitionNode}) => {

    const { node } = props
    const context = useContext<ChapterContextType>(ChapterContext)

    // If there's no context, render nothing.
    if(!context || !context.book)
        return <></>

    // Find the definition.
    let glossary = context.book.getGlossary();

    if(!(node.glossaryID in glossary))
        return <span className="bookish-error">Unknown glossary entry "{ node.glossaryID }"</span>

    let entry = glossary[node.glossaryID];

    return <span className="bookish-definition">
        <Marginal
            id={"glossary-" + node.glossaryID}
            interactor={renderNode(node.phrase)}
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