import React, { KeyboardEvent, useEffect, useRef, useState } from "react"

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
    const [ error, setError ] = useState<undefined | string>(props.valid.call(undefined, props.text))
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
        if(sizer.current) {
            // Set the invisible sizer to the text to set the container's width.
            // The browser strips trailing spaces, causing jitter after a space, so we replace
            // them with non-breaking spaces.
            const sizedText = showPlaceholder() ? props.placeholder : text.replace(/\s/g, "\u00a0");
            // Clip the text to prevent this editor from getting too long. If it goes past one line,
            // the measurements and layout are way off.
            const trimmedText = status === Status.Viewing ? sizedText : sizedText.substring(0, 60);
            sizer.current.innerHTML = trimmedText;
        }
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
            if(validate(newValue) === undefined)
                props.save.call(undefined, newValue);
        }
    }

    function validate(value: string): string | undefined {
        const error = props.valid.call(undefined, value);
        setError(error);
        return error;
    }

    function handleKeyPress(event: KeyboardEvent) {
        grow();
        if(event.key === "Enter") {
            setStatus(Status.Viewing);
            event.preventDefault();
        }
    }

    return <span className={`bookish-text-editor ${showPlaceholder() ? "bookish-text-editor-placeholder" : ""} ${status === Status.Viewing ? "bookish-text-editor-viewing" : ""}`}>
        <span className="bookish-text-editor-sizer" aria-hidden={true} ref={sizer} onClick={startEditing}></span>
        <input
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
                <span
                    aria-live="polite"
                    className={`bookish-text-editor-error ${status === Status.Editing ? "bookish-text-editor-error-focused" : ""}`}
                >
                        {status === Status.Viewing ? "\u2715" : error}
                </span> : 
            null 
        }
    </span>

}

export default TextEditor