import React, { useContext, useEffect, useRef, useState } from "react"
import { EditorContext } from "../page/Book"

const ConfirmButton = (props: { commandLabel: string, confirmLabel: string, command: () => Promise<void> | undefined }) => {

    const [ confirming, setConfirming ] = useState(false)
    const [ executing, setExecuting ] = useState(false)
    const [ timeoutID, setTimeoutID ] = useState<NodeJS.Timeout | undefined>(undefined)
    const isMounted = useRef(false)

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false }
    }, [])

    function execute() {
    
        if(!confirming && !executing) {
            setConfirming(true)
            setTimeoutID(setTimeout(() => isMounted.current ? setConfirming(false) : undefined, 2000))
        } else if(confirming) {
            props.command.call(undefined)
                ?.finally(() => {
                    if(isMounted.current) {
                        if(timeoutID) clearTimeout(timeoutID)
                        setConfirming(false)
                        setExecuting(false)
                    }
                })
        }

    }

    return <button 
        disabled={executing} 
        onClick={execute} 
        className={confirming ? "bookish-editor-confirm" : ""}>
            { confirming ? props.confirmLabel : props.commandLabel }
    </button>


}

export default ConfirmButton