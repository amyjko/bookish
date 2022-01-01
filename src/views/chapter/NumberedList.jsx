import React from 'react'
import { renderNode } from './Renderer'

function NumberedList(props) {

    return <ol>{
        props.node.items.map((item, index) =>
            item.type === "numbered" ?
                renderNode(item, "item-" + index) :
                <li key={"item-" + index}>{renderNode(item)}</li>
        )}
    </ol>
}

export default NumberedList