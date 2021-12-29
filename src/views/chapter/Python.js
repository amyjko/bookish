import React from 'react';
import Code from './Code';

class Python extends React.Component {

    constructor(props) {
        super(props);

        this.handleEdit = this.handleEdit.bind(this);
        this.handleOutput = this.handleOutput.bind(this);
        this.reset = this.reset.bind(this);
        this.start = this.start.bind(this);

        // This keeps track of the raw output from the runtime
        this.output = "";

        this.state = {
            code: this.props.code,  // Start with whatever code was passed in.
            output: "",             // What is currently rendered to the console (not always program output).
            loaded: false           // Whether the runtime is loaded.
        };

        this.ref = React.createRef();

    }

    componentDidMount() {

        // Dynamically load the script to minimize payload and reduce index complexity.
        if(document.getElementById("skulpt") === null) {

            let script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.onload = () => this.setState({ loaded: true });
            script.src = "https://cdn.jsdelivr.net/combine/npm/skulpt@1.2.0/dist/skulpt.min.js,npm/skulpt@1.2.0/dist/skulpt-stdlib.min.js";
            document.getElementsByTagName('head')[0].appendChild(script);

        }

    }

    // Always scroll to the bottom of the output.
    componentDidUpdate() {

        if(this.ref.current) {
            let output = this.ref.current.querySelector(".python-output");
            output.scrollTop = output.scrollHeight;
        }

    }

    reset(code) {

        this.setState({code: this.props.code});

    }

    handleEdit(code) {

        this.setState({code: code});

    }
    
    handleOutput(output) {

        // Append the output.
        this.output = this.output + output;

        // Update the state to re-render.
        this.setState({ output: this.output });

    }

    start() {

        if(Sk) {

            // Communicate that executing is starting, wait a second, then execute the program.
            // This is important in case the user wants to run it again; it provides confirmation that it was run again.
            this.output = "";
            this.setState({ output: "Executing..." }, () => setTimeout(() => this.execute(), 500));

        }

    }

    execute() {

        // Reset the output, run the code, and update it's output.
        this.setState({ output: "" }, () => {
            Sk.configure({ output: this.handleOutput });
            try {
                Sk.importMainWithBody("<stdin>", false, this.state.code, true);
            } catch(error) {
                this.handleOutput(error);
            }
        });

    }

    render() {

        // Replace newlines in the output with line breaks.
        let lines = this.state.output.split("\n");
        lines = lines.map((line, index) => <span className="python-output-line" key={index}>{line}{index < lines.length - 1 ? <br/> : null}</span>)

        return <div className="python" ref={this.ref}>
            <Code inline={false} language={"python"} editable edited={this.handleEdit}>{this.state.code}</Code>
            <div className="code-language">{"python"}</div>
            <div>
                <button disabled={this.state.code === this.props.code } onClick={this.reset}>{"\u21BB"}</button>
                <button disabled={!this.state.loaded} onClick={this.start}>{"\u25B6\uFE0E"}</button>
                <div className="python-output">{lines}</div>
            </div>
        </div>

    }

}

export default Python