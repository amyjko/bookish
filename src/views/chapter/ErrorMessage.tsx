import React from 'react'
import { ErrorNode } from "../../models/ErrorNode"

const ErrorMessage = (props: { node: ErrorNode }) => {

    return <span className="bookish-error" data-nodeid={props.node.nodeID}>Error: {props.node.error}</span>

}

export default ErrorMessage