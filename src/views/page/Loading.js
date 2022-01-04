import React from 'react';

class Loading extends React.Component {

    render() {

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

}

export default Loading