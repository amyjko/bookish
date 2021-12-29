import React from 'react'
import { renderNode } from './Renderer'

function NumberedList(props) {

    return <ol key={props.key}>{
        props.node.items.map((item, index) =>
            item.type === "numbered" ?
                renderNode(item, props.context, "item-" + index) :
                <li key={"item-" + index}>{renderNode(item, props.context)}</li>
        )}
    </ol>
}

export default NumberedList