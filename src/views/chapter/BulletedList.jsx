import React from 'react'
import { renderNode } from './Renderer'

function BulletedList(props) {

    return <ul key={props.key}>{
        props.node.items.map((item, index) =>
            item.type === "bulleted" ?
                renderNode(item, props.context, "item-" + index) :
                <li key={"item-" + index}>{renderNode(item, props.context)}</li>
        )}
    </ul>

}

export default BulletedList