import React, { useContext } from 'react'
import { EditorContext } from '../page/Book';

const Toggle = (props: { 
    on: boolean,
    children : React.ReactNode[] | React.ReactNode,
    save: (set: boolean) => Promise<void>
}) => {

    const { setEditingBook } = useContext(EditorContext)

    function toggle() {

        if(setEditingBook)
            setEditingBook(true);

        props.save.call(undefined, !props.on)
        .then(() => {
        })
        .catch((message: Error) => {
        })
        .finally(() => {
            if(setEditingBook)
                setEditingBook(false);
        })

    }

    return <span className="bookish-app-interactive" onClick={toggle}>
        {props.children}
    </span>

}

export default Toggle