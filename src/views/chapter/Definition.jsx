import React from 'react'
import Marginal  from './Marginal'
import { renderNode } from './Renderer'
import Parser from '../../models/Parser'

function Definition(props) {

    const { node, context, key } = props

    // If there's no context, render nothing.
    if(!context)
        return null

    // Find the definition.
    let glossary = context.app.getBook().getGlossary();

    if(!(node.glossaryID in glossary))
        return <span key={key} className="alert alert-danger">Unknown glossary entry "{ node.glossaryID }"</span>

    let entry = glossary[node.glossaryID];

    return <span className="terminology" key={key}>
        <Marginal
            chapter={context.app}
            id={"glossary-" + node.glossaryID}
            interactor={renderNode(node.phrase, context)}
            content={
                <span className="definition">
                    <strong className="definition-phrase">{entry.phrase}</strong>: { renderNode(Parser.parseContent(context.app.getBook(), entry.definition), context, "definition") }
                    {
                        entry.synonyms && entry.synonyms.length > 0 ? <span className="definition-synonyms"><br/><br/>{entry.synonyms.join(", ")}</span> : null
                    }
                </span>
            }
        />
    </span>


}

export default Definition