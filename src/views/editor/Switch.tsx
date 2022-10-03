import React, { useContext } from 'react'
import { CaretContext } from './CaretContext';

const Switch = (props: { 
    options: string[],
    value: string,
    position?: string,
    enabled?: boolean,
    edit : (newValue: string) => void
}) => {

    const { value, edit, position } = props;

    const caret = useContext(CaretContext);

    function handleClick(event: React.MouseEvent) {

        // Don't let anything else handle the click.
        event.stopPropagation();
        const newValue = (event.currentTarget as HTMLElement).dataset.value;
        if(newValue && props.options.includes(newValue)) {
            edit.call(undefined, newValue);
        }

        // Force an update on the chapter.
        if(caret)
            caret.forceUpdate();

    }

    return <span className={`bookish-app-switch bookish-app-${position === "<" ? "left" : position === ">" ? "right" : "middle"}`}>
        {
            props.options.map((option, index) =>
                <button 
                    key={`option-${index}`} 
                    className={`bookish-app-switch-option ${value === option ? "bookish-app-switch-option-selected" : ""}`} 
                    data-value={option} 
                    disabled={props.enabled === false}
                    onClick={handleClick}>
                        {option}
                </button>
            )
        }
    </span>

}

export default Switch;