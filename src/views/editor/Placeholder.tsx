import React from "react";

const Placeholder = (props: { text: string }) => {

    return <div className="bookish-editor-placeholder">
        {props.text}
    </div>
}

export default Placeholder;