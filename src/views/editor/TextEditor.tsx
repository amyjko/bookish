import React, { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from "react"

enum Status {
    Viewing,
    Editing
}

const TextEditor = (props: {
    text: string, 
    label: string,
    placeholder: string,
    valid: (text: string) => string | undefined,
    save: (text: string) => Promise<void> | undefined
 }) => {

    const [ status, setStatus ] = useState(Status.Viewing)
    const [ text, setText ] = useState(props.text)
    const [ error, setError ] = useState<undefined | string>(undefined)
    const textField = useRef<HTMLInputElement>(null)
    const sizer = useRef<HTMLSpanElement>(null);

    useEffect(() => {
      grow();
    }, [text, status]);

    useEffect(() => {
        if(status === Status.Editing)
            textField?.current?.focus();
        else
            textField?.current?.blur();
    }, [status])

    function showPlaceholder() {
        return text === "" && status == Status.Viewing;
    }

    function grow() {
        if(sizer.current)
            // Set the invisible sizer to the text to set the container's width.
            // The browser strips trailing spaces, causing jitter after a space, so we replace
            // them with non-breaking spaces.
            sizer.current.innerHTML = showPlaceholder() ? props.placeholder : text.replace(/\s/g, "\u00a0");
    }

    function startEditing() {
        setStatus(Status.Editing);
    }

    function stopEditing() {
        setStatus(Status.Viewing);
    }

    function edit() {
        if(textField?.current) {
            const newValue = textField?.current.value;
            setText(newValue)
            if(validate(newValue))
                props.save.call(undefined, newValue);
        }
    }

    function validate(value: string): boolean {
        const error = props.valid?.call(undefined, value);
        setError(error);
        return error === undefined;
    }

    function handleKeyPress(event: KeyboardEvent) {
        grow();
        if(event.key === "Enter") {
            setStatus(Status.Viewing);
            event.preventDefault();
        }
    }

    return <span className="bookish-text-editor">
        <span className="bookish-text-editor-sizer" aria-hidden={true} ref={sizer}></span>
        <input
            className={`${text === "" ? "bookish-text-editor-placeholder" :""}`}
            type="text" 
            required
            role="textbox"
            tabIndex={0}
            aria-invalid={error !== undefined}
            aria-label={props.label}
            ref={textField}
            value={showPlaceholder() ? props.placeholder : text}
            onChange={edit}
            onKeyPress={handleKeyPress}
            onBlur={stopEditing}
            onFocus={startEditing}
        />
        {
            error ? 
                <div
                    aria-live="polite"
                    className="bookish-text-editor-error">{error}
                </div> : 
            null 
        }
    </span>

}

export default TextEditor