import React, { useEffect, useState } from 'react'

const Options = (props: { 
    multiple: boolean,
    options : { value: string, label: string }[],
    values : string[],
    change: (values: string[]) => void,
}) => {

    const { multiple, options, values, change } = props;

    useEffect(() => {
        change.call(undefined, values);
    }, [values])

    function handleClick(event: React.MouseEvent) {

        // Don't let anything else handle the click.
        event.stopPropagation();
        const newValue = (event.currentTarget as any).dataset.value;
        if(multiple) {
            const index = values.indexOf(newValue);
            const newValues = [ ... values ];
            if(index < 0)
                newValues.push(newValue);
            else
                newValues.splice(index, 1);
            change.call(undefined, newValues);
        }
        else
            change.call(undefined, [ newValue ]);

    }

    return <span className={`bookish-app-options`}>
        { options.map((option, index) => 
            <span 
                key={index} 
                className={`bookish-app-options-option ${values.includes(option.value) ? "bookish-app-options-option-selected" : ""}`} 
                data-value={option.value}
                onMouseDown={handleClick}
            >
                { values.includes(option.value) ? <span>{"\u2713"}</span> : <span></span> } <span>{option.label}</span>
            </span>
            )
        }
    </span>

}

export default Options;