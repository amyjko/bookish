import React, { useContext } from 'react'
import { EditorContext } from './EditorContext';

const Print = (props: { children: React.ReactNode }) => {

    const { editable } = useContext(EditorContext)

    return <>{ editable && <div className="bookish-instructions">{props.children}</div>}</>;

}

export default Print