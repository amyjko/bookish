import React, { useContext, useState } from 'react'
import { EditorContext } from '../page/Book';

enum Status {
    Viewing,
    Saving,
    Error
}
const Toggle = (props: { 
    on: boolean,
    children : React.ReactNode[] | React.ReactNode,
    save: (set: boolean) => Promise<void>
}) => {

    const [ saving, setSaving ] = useState(Status.Viewing)

    function toggle() {

        setSaving(Status.Saving)

        props.save.call(undefined, !props.on)
            .then(() => setSaving(Status.Viewing))
            .catch(() => setSaving(Status.Error))

    }

    return <div 
        className={
            "bookish-app-interactive" + 
                (saving === Status.Saving ? " bookish-app-editable-saving" : "") +
                (saving === Status.Error ? " bookish-app-editable-error" : "")} onClick={toggle}>
        {props.children}
    </div>

}

export default Toggle