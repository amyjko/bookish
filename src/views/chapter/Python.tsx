import React, { useState, useRef, useEffect } from 'react';
import { CodeNode } from "../../models/CodeNode";
import Code from './Code';

// Make Typescript happy
type Skulpt = { configure: Function, importMainWithBody: Function} | undefined
declare var Sk: Skulpt

const Python = (props: { node: CodeNode, code: string }) => {

    // Start with whatever code was passed in.
    const [code, setCode] = useState<string>(props.code)

    // What is currently rendered to the console (not always program output).
    const [programOutput, setProgramOutput] = useState<string>("")

    // What is currently rendered to the console (not always program output).
    const [output, setOutput] = useState<string>("")

    // Whether the runtime is loaded.
    const [loaded, setLoaded] = useState<boolean>(false)

    let ref = useRef<HTMLDivElement>(null)

    useEffect(() => {

        // Dynamically load the script to minimize payload and reduce index complexity.
        if(document.getElementById("skulpt") === null) {

            let script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.onload = () => setLoaded(true)
            script.src = "https://cdn.jsdelivr.net/combine/npm/skulpt@1.2.0/dist/skulpt.min.js,npm/skulpt@1.2.0/dist/skulpt-stdlib.min.js";
            document.getElementsByTagName('head')[0].appendChild(script);

        }
        
    }, [])

    // Always scroll to the bottom of the output.
    useEffect(() => {

        if(ref.current) {
            let outputView = ref.current.querySelector(".bookish-python-output");
            if(outputView)
                outputView.scrollTop = outputView.scrollHeight;
        }

    })

    function reset() {

        setCode(props.code)

    }

    function handleEdit(code: string) {

        setCode(code);

    }
    
    function handleOutput(out: string) {

        // Remember the output
        setProgramOutput(out)

        // Update the state to re-render.
        setOutput(out)

    }

    function start() {

        if(Sk) {

            // Communicate that executing is starting, wait a second, then execute the program.
            // This is important in case the user wants to run it again; it provides confirmation that it was run again.
            setProgramOutput("")
            setOutput("Executing...")
            setTimeout(() => execute(), 500);

        }

    }

    function execute() {

        // Reset the output, run the code, and update it's output.
        setOutput("")
        if(Sk) {
            Sk.configure({ output: handleOutput });
            try {
                if(Sk)
                    Sk.importMainWithBody("<stdin>", false, code, true);
            } catch(error) {
                handleOutput(error as string);
            }
        }

    }

    // Replace newlines in the output with line breaks.
    let lines = output.split("\n");
    let spans = lines.map((line: string, index: number) => <span className="python-output-line" key={index}>{line}{index < lines.length - 1 ? <br/> : null}</span>)

    return <div className="bookish-python" ref={ref}>
        <Code inline={false} language={"python"} editable edited={handleEdit} nodeID={props.node.nodeID}>{code}</Code>
        <div className="bookish-code-language">{"python"}</div>
        <div>
            <button disabled={code === props.code } onClick={reset}>{"\u21BB"}</button>
            <button disabled={!loaded} onClick={start}>{"\u25B6\uFE0E"}</button>
            <div className="bookish-python-output">{spans}</div>
        </div>
    </div>

}

export default Python