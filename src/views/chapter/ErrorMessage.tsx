import React from 'react'
import { ErrorNode } from '../../models/Parser'

const ErrorMessage = (props: { node: ErrorNode }) => {

    return <span className="bookish-error">Error: {props.node.error}</span>

}

export default ErrorMessage