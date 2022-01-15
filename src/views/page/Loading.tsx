import React from 'react';

const Loading = () => {

    return <div className={"bookish bookish-loading" + (localStorage.getItem("bookish-dark") === "true" ? " bookish-dark" : "")}>
            <div className="bookish-loading-animation">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
    </div>

}

export default Loading