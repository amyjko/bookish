import React from 'react'
import Chapter from "../chapter/Chapter"

class Print extends React.Component {

	render() {

        if(!this.props.app.getBook())
            return <>Loading...</>

        return <>
            {
                // Render all of the chapters
                this.props.app.getBook().getChapters().map(
                    (chapter, index) => <Chapter key={index} chapter={chapter} app={this.props.app} print />
                )
            }
        </>
    }

}

export default Print