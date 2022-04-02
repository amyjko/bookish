import React from 'react'
import Switch from './Switch';

const PositionEditor = (props: { 
    value: string,
    edit : (newValue: string) => void
}) => {

    return <Switch
        options={["<", "|", ">"]}
        value={props.value}
        edit={props.edit} 
    />

}

export default PositionEditor;