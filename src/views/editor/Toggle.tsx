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
    save: (set: boolean) => Promise<void> | undefined
}) => {

    const [ saving, setSaving ] = useState(Status.Viewing)

    function toggle() {

        setSaving(Status.Saving)

        const promise = props.save.call(undefined, !props.on);

        if(promise === undefined) {
            setSaving(Status.Viewing);
            return;
        }

        promise
            .then(() => setSaving(Status.Viewing))
            .catch(() => setSaving(Status.Error))

    }

    return <div 
        className={
            "bookish-app-interactive" + 
                (saving === Status.Saving ? " bookish-text-editor-saving" : "") +
                (saving === Status.Error ? " bookish-text-editor-error" : "")} onClick={toggle}>
        {props.children}
    </div>

}

export default Toggle