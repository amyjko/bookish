import React from 'react';
import { Code } from './../views/code';

class Python extends React.Component {

    constructor(props) {
        super(props);

        this.output = this.output.bind(this);
        this.start = this.start.bind(this);

        this.state = {
            output: "",
            loaded: false
        };

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
    
    output(output) {

        // Append the output.
        this.setState({ output: this.state.output + output });

    }

    start() {

        if(Sk) {

            // Communicate that executing is starting, wait a second, then execute the program.
            // This is important in case the user wants to run it again; it provides confirmation that it was run again.
            this.setState({ output: "Executing..." }, () => setTimeout(() => this.execute(), 500));

        }

    }

    execute() {

        // Reset the output, run the code, and update it's output.
        this.setState({ output: "" }, () => {
            Sk.configure({ output: this.output });
            try {
                Sk.importMainWithBody("<stdin>", false, this.props.code, true);
            } catch(error) {
                this.output(error);
            }
        });

    }

    render() {

        return <div className="python">
            <Code inline={false} language={"python"}>{this.props.code}</Code>
            <div className="code-language">{"python"}</div>
            <div>
                <button disabled={!this.state.loaded} onClick={this.start}>{"\u25B6\uFE0E"}</button>
                <div className="python-output">{this.state.output}</div>
            </div>
        </div>

    }

}

export { Python }