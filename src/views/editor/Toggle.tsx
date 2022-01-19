import React, { useContext, useState } from 'react'
import { EditorContext } from '../page/Book';

const Toggle = (props: { 
    on: boolean,
    children : React.ReactNode[] | React.ReactNode,
    save: (set: boolean) => Promise<void>
}) => {

    const { setEditingBook } = useContext(EditorContext)
    const [ saving, setSaving ] = useState(false)

    function toggle() {

        if(setEditingBook)
            setEditingBook(true);
        setSaving(true)

        props.save.call(undefined, !props.on)
        .then(() => {
        })
        .catch((message: Error) => {
        })
        .finally(() => {
            setSaving(false)
            if(setEditingBook)
                setEditingBook(false);
        })

    }

    return <span className={"bookish-app-interactive" + (saving ? " bookish-app-editable-saving" : "")} onClick={toggle}>
        {props.children}
    </span>

}

export default Toggle