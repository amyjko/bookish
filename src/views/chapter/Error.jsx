import React from 'react'

function Error(props) {

    return <span key={props.key} className="bookish-error">Error: {props.node.error}</span>

}

export default Error