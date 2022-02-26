import hljs from 'highlight.js';
import React, { useEffect, useRef } from 'react';

// Suppress unescaped HTML warning, trusting the escaping of the parser.
hljs.configure({ ignoreUnescapedHTML: true });

const Code = (props: { editable: boolean, inline: boolean, nodeID: number | undefined, edited?: Function, language?: string, children: React.ReactNode}) => {

    const el = useRef<HTMLElement>(null);

    // Find any code tags inside and highlight them.
    function highlightCode() {
        if(el.current)
            hljs.highlightElement(el.current);
    }
    
    // When the component mounts or updates, highlight the code inside.
    useEffect(() => {
        highlightCode();
    })

    function handleChange() {

        if(el.current && props.edited)
            props.edited.call(null, el.current.innerText);

    }

    // There's no way to mute highlightjs warnings on missing languages, so we check here.
    let lang = props.language ? (hljs.getLanguage(props.language) === undefined ? "text" : props.language) : "plaintext";

    return <code 
        data-nodeid={props.nodeID}
        contentEditable={props.editable}
        suppressContentEditableWarning={true}
        className={`bookish-code ${props.inline ? "bookish-code-inline" : "bookish-code-block"} ${"language-" + lang}`} 
        onBlur={handleChange}
        ref={el}>
            {props.children}
    </code>

}

export default Code