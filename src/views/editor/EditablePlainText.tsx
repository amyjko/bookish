import React, { KeyboardEvent, useEffect, useRef, useState, useContext } from "react"
import { EditorContext } from "../page/Book"

enum Status {
    Viewing,
    Editing,
    Saving,
    Saved
}

const EditablePlainText = (props: {
    text: string, 
    validationError: (text: string) => string | undefined,
    save: (text: string) => Promise<void>,
    children: React.ReactNode | React.ReactNode[]
 }) => {

    const [ status, setStatus ] = useState<Status>(Status.Viewing)
    const [ text, setText ] = useState(props.text)
    const [ error, setError ] = useState<undefined | string>(undefined)
    const editor = useRef<HTMLInputElement>(null)
	const { setEditingBook } = useContext(EditorContext)

    function startEditing() {
        setStatus(Status.Editing);
        setText(props.text);
        setError(props.validationError.call(undefined, props.text))
    }

    function edit() {
        if(editor?.current) {
            setText(editor.current.value)
            setError(props.validationError.call(undefined, editor.current.value))
            if(setEditingBook)
                setEditingBook(true);
        }
    }

    function save() {

        // If the text hasn't changed, just flip back to viewing.
        if(text === props.text) {
            // Return to viewing
            setStatus(Status.Viewing);
            // Notify the book that we're done editing
            if(setEditingBook)
                setEditingBook(false);            
        }
        // If there's no validation error and the text changed, save
        else if(props.validationError.call(undefined, text) === undefined) {

            // Disable the input temporarily
            if(editor?.current)
                editor.current.disabled = true

            // Remove any error feedback and set to saving
            setError(undefined)
            setStatus(Status.Saving)

            // Attempt to save
            props.save.call(undefined, text)
                .then(() => {
                    // Success! Lose focus...
                    editor?.current?.blur();
                    // Changed to saved status...
                    setStatus(Status.Saved);
                    // Notify the book that we're done editing
                    if(setEditingBook)
                        setEditingBook(false);
                })
                .catch((message: Error) => {
                    // Restore editing and show the error.
                    if(editor?.current)
                        editor.current.disabled = false
                    editor?.current?.focus()
                    setStatus(Status.Editing);
                    setError(message.message)
                })
        }
    }

    // Save when enter is pressed.
    function handleKeystroke(event: KeyboardEvent) {

        if(event.key === "Enter")
            save()

    }

    // If editing changes to true, focus the input.
    useEffect(() => {
        if(status === Status.Editing)
            editor?.current?.focus()
    }, [status])


    const statusClass = "bookish-app-editable-" + ["viewing", "editing", "saving", "saved"][status];

    return status === Status.Viewing || status === Status.Saved ?
        <>
            <span className={"bookish-app-editable " + statusClass} onClick={startEditing}>{ props.children }</span>
        </>
        :
        <> 
            <input
                className={"bookish-app-editable " + statusClass + (error ? " bookish-app-editable-error" : "")}
                type="text" 
                required
                aria-invalid={error ? true: false}
                aria-label="Book title"
                aria-errormessage="bookish-app-title-error"
                ref={editor}
                value={text}
                onChange={edit}
                onKeyPress={handleKeystroke}
                onBlur={save}
            />
            {error ? 
                <span 
                    id="bookish-app-title-error" 
                    aria-live="polite"
                    className="bookish-app-editable-message bookish-app-editable-message-error">{error}</span> : null }
        </>

}

export default EditablePlainText