import React from 'react'

const Switch = (props: { 
    options: string[],
    value: string,
    position?: string,
    edit : (newValue: string) => void
}) => {

    const { value, edit, position } = props;
 
    function handleClick(event: React.MouseEvent) {

        // Don't let anything else handle the click.
        event.stopPropagation();
        const newValue = (event.currentTarget as HTMLElement).dataset.value;
        if(newValue && props.options.includes(newValue)) {
            edit.call(undefined, newValue);
        }

    }

    return <div className={`bookish-app-switch bookish-app-${position === "<" ? "left" : position === ">" ? "right" : "middle"}`}>
        {
            props.options.map((option, index) =>
                <span 
                    key={`option-${index}`} 
                    className={`bookish-app-switch-option ${value === option ? "bookish-app-switch-option-selected" : ""}`} 
                    data-value={option} 
                    onClick={handleClick}>
                        {option}
                </span>
            )
        }
    </div>

}

export default Switch;