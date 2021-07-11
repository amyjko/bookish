import hljs from 'highlight.js';
import React from 'react';

// Suppress unescaped HTML warning, trusting the escaping of the parser.
hljs.configure({ ignoreUnescapedHTML: true });

class Code extends React.Component {

    constructor(props) {

        super(props)
        this.setEl = this.setEl.bind(this)

    }

    // When the component mounts, highlight the code inside.
    componentDidMount() {
        this.highlightCode();
    }

    // When the component updates, highlight the code inside.
    componentDidUpdate() {
        this.highlightCode();
    }

    // Find any code tags inside and highlight them.
    highlightCode() {
        hljs.highlightElement(this.el);
    }

    // Capture the DOM node this element represents
    setEl(el) {
        this.el = el;
    };

    // Render some code, wrapping in a <pre> if it's a block.
    render() {
        return <code 
            className={"code " + (this.props.inline ? "code-inline" : "code-block") + " language-" + this.props.language} 
            ref={this.setEl}>
                {this.props.children}
        </code>;
    }

}

Code.defaultProps = {
    inline: false,
    language: "plaintext"
}

export { Code }