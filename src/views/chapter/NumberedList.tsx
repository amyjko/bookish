import React from 'react'
import { NumberedListNode } from '../../models/Parser'
import { renderNode } from './Renderer'

const NumberedList = (props: { node: NumberedListNode}) => {

    return <ol>{
        props.node.items.map((item, index) =>
            item.type === "numbered" ?
                renderNode(item, "item-" + index) :
                <li key={"item-" + index}>{renderNode(item)}</li>
        )}
    </ol>
}

export default NumberedList