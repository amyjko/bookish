import React from 'react'
import { RuleNode } from "../../models/RuleNode"

const Rule = (props: {node: RuleNode}) => {

    return <hr data-nodeid={props.node.nodeID}/>

}

export default Rule