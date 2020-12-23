import React from 'react';

import { Parser } from "../parser";

class Header extends React.Component {

    render() {

        return (
            <div>
                {
                    this.props.image ?
                        Parser.parseEmbed(this.props.image).toDOM() :
                        null
                }
                <h1>{this.props.header}</h1>
                <div className="lead">{this.props.content}</div>
            </div>
        );

    }

}

export { Header };