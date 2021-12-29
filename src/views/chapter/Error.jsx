import React from 'react'

function Error(props) {

    return <span key={props.key} className="alert alert-danger">Error: {props.node.error}</span>

}

export default Error