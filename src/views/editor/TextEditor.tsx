import React, { KeyboardEvent, useEffect, useRef, useState, useContext } from "react"
import { EditorContext } from "../page/Book"

enum Status {
    Viewing,
    Editing,
    Saving,
    Saved
}

const TextEditor = (props: {
    text: string, 
    label: string,
    multiline?: boolean,
    validationError?: (text: string) => string | undefined,
    save: (text: string) => Promise<void>,
    children: React.ReactNode | React.ReactNode[]
 }) => {

    const [ status, setStatus ] = useState<Status>(Status.Viewing)
    const [ text, setText ] = useState(props.text)
    const [ error, setError ] = useState<undefined | string>(undefined)
    const inputEditor = useRef<HTMLInputElement>(null)
    const textareaEditor = useRef<HTMLTextAreaElement>(null)
	const { setEditingBook } = useContext(EditorContext)

    function measure() {
        if(textareaEditor?.current) {
            textareaEditor.current.style.height = "auto";
            textareaEditor.current.style.height = (textareaEditor.current.scrollHeight) + "px";
        }
    }

    function startEditing() {
        setStatus(Status.Editing);
        setText(props.text);
        if(props.validationError)
            setError(props.validationError.call(undefined, props.text))
    }

    function getEditor() {

        return inputEditor?.current ? inputEditor.current :
            textareaEditor?.current ? textareaEditor.current :
            null

    }

    function edit() {

        const editor = getEditor()

        measure()

        if(editor) {
            setText(editor.value)
            if(props.validationError)
                setError(props.validationError.call(undefined, editor.value))
            if(setEditingBook)
                setEditingBook(true);
        }
    }

    function cancel() {

        // Return to viewing
        setStatus(Status.Viewing);
        // Notify the book that we're done editing
        if(setEditingBook)
            setEditingBook(false);        
        
    }

    function save() {

        // If the text hasn't changed, just flip back to viewing.
        if(text === props.text) {
            cancel()
        }
        // If there's no validation error and the text changed, save
        else if(!props.validationError || props.validationError.call(undefined, text) === undefined) {

            const editor = getEditor()

            // Disable the input temporarily
            if(editor)
                editor.disabled = true

            // Remove any error feedback and set to saving
            setError(undefined)
            setStatus(Status.Saving)

            // Attempt to save
            props.save.call(undefined, text)
                .then(() => {
                    // Success! Lose focus...
                    editor?.blur();
                    // Changed to saved status...
                    setStatus(Status.Saved);
                    // Notify the book that we're done editing
                    if(setEditingBook)
                        setEditingBook(false);
                })
                .catch((message: Error) => {
                    // Restore editing and show the error.
                    if(editor)
                        editor.disabled = false
                    editor?.focus()
                    setStatus(Status.Editing);
                    setError(message.message)
                })
        }
    }

    // Save when enter is pressed.
    function handleKeystroke(event: KeyboardEvent) {

        if(event.key === "Enter" && (!props.multiline || event.shiftKey)) {
            save()
            event.preventDefault()
        }
        else if(event.key === "Escape")
            cancel()

    }

    // If editing changes to true, focus the input.
    useEffect(() => {
        measure()
        if(status === Status.Editing)
            getEditor()?.focus()
    }, [status])

    const statusClass = "bookish-app-editable-" + ["viewing", "editing", "saving", "saved"][status];

    return status === Status.Viewing || status === Status.Saved ?
        // If viewed or just saved, render the children passed in
        <>
            <span className={"bookish-app-editable " + statusClass} onClick={startEditing}>{ props.children }</span>
        </>
        :
        // If it's multiline, render a text area
        props.multiline ?
        <textarea
            className={"bookish-app-editable " + statusClass}
            required
            aria-invalid={error ? true: false}
            aria-label={props.label}
            ref={textareaEditor}
            value={text}
            onChange={edit}
            onBlur={save}
            onKeyDown={handleKeystroke}
        />
        :
        // Otherwise, render a single line text input
        <> 
            <input
                className={"bookish-app-editable " + statusClass + (error ? " bookish-app-editable-error" : "")}
                type="text" 
                required
                aria-invalid={error ? true: false}
                aria-label={props.label}
                aria-errormessage="bookish-app-title-error"
                ref={inputEditor}
                value={text}
                onChange={edit}
                onKeyDown={handleKeystroke}
                onBlur={save}
            />
            {error ? 
                <span 
                    id="bookish-app-title-error" 
                    aria-live="polite"
                    className="bookish-app-editable-message bookish-app-editable-message-error">{error}</span> : null }
        </>

}

export default TextEditor