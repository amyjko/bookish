import { useContext, useEffect } from 'react'
import Marginal  from './Marginal'
import Parser from '../../models/chapter/Parser'
import { DefinitionNode } from "../../models/chapter/DefinitionNode"
import { ChapterContext, ChapterContextType } from './ChapterContext'
import Text from './Text'
import Format from './Format'

const Definition = (props: { node: DefinitionNode}) => {

    const { node } = props
    const glossaryID = node.getMeta();
    const phrase = node.getText();

    const context = useContext<ChapterContextType>(ChapterContext);

    // If there's no context, render nothing.
    if(!context || !context.book)
        return <></>

    // Find the definition.
    let glossary = context.book.getGlossary();
    let entry = glossary[glossaryID];

    // Position the marginals on every render.
    useEffect(() => {
        if(context && context.layoutMarginals) {
            context.layoutMarginals();
        }
    });

    const phraseView = <Text node={phrase}/>
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
                                    <strong className="bookish-definition-entry-phrase">{entry.phrase}</strong>: { <Format node={Parser.parseFormat(context.book, entry.definition)} key="definition" /> }
                                    { entry.synonyms && entry.synonyms.length > 0 ? <span className="bookish-definition-entry-synonyms"><br/><br/>{entry.synonyms.join(", ")}</span> : null }
                                </>
                        }
                    </span>
                }
            />
        </span>;

    return marginalView;

}

export default Definition