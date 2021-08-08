import React from 'react';

import { Link } from 'react-router-dom';
import { NavHashLink } from "react-router-hash-link";

class Outline extends React.Component {

    constructor(props) {
        super(props);

        this.toggle = this.toggle.bind(this);

        this.layout = this.layout.bind(this);

    }

    toggle() {
        this.props.chapter.toggleOutline(!this.props.expanded, this.layout);
    }

    // Position outline after first render.
    componentDidMount() {

        window.addEventListener('resize', this.layout);
		window.addEventListener('scroll', this.layout);

        this.layout();
    }

    componentWillUnmount() {

		window.removeEventListener('scroll', this.layout);
		window.removeEventListener('resize', this.layout);

    }

    layout() {

		// Left align the the floating outline with the left margin of the chapter.
		let outline = document.getElementsByClassName("outline")[0];
		let title = document.getElementsByClassName("title")[0];

        // If we found them both...
        if(outline && title) {

            // Determine if we're in footer mode. This is a horrible hack dependency on style.
            let inFooter = window.getComputedStyle(outline).getPropertyValue("cursor") === "pointer";

            // If so, remove the inline position so the footer CSS applies.
			if(inFooter) {
				outline.style.removeProperty("left");
			}
            // If not, set the left position of the outline.
			else {
				let titleX = title.getBoundingClientRect().left + window.scrollX;
				outline.style.left = titleX + "px";
                this.props.chapter.toggleOutline(false);
			}
		}
		
	}

    componentDidUpdate(prevProps) {

        if(this.props.expanded !== prevProps.expanded)
            this.layout();

    }

	render() {

        return (
            <div className={"outline " + (this.props.expanded ? "outline-expanded": "outline-collapsed")} onClick={this.toggle}>
                {/* Visual cue of expandability, only visible in footer mode. */}
                <div className="outline-collapse-cue">▲</div>
                <div className="outline-headers">
                    {/* Book navigation links */}
                    <div className="outline-header outline-header-level-0 outline-header-nav">
                        { this.props.previous ? <span><Link to={"/" + this.props.previous.id}>Prev</Link></span> : <span>Prev</span> }
                        &nbsp;&middot;&nbsp;
                        <Link to={"/"}>Home</Link>
                        &nbsp;&middot;&nbsp;
                        { this.props.next ? <Link to={"/" + this.props.next.id}>Next</Link> : <span>Next</span> }
                    </div>

                    {/* Title link */}
                    <div className={"outline-header outline-header-level-0" + (this.props.headerIndex < 0 ? " outline-header-active" : "")}>
                        <NavHashLink smooth to="#title">{this.props.title}</NavHashLink>
                    </div>

                    {/* Header links */}
                    {
                        this.props.headers.map((header, index) => 
                            // Only first and second level headers...
                            header.level > 2 ? 
                                null :
                                <div key={"header-" + index} className={"outline-header outline-header-level-" + header.level + (this.props.headerIndex === index ? " outline-header-active" : "")}>
                                    <NavHashLink 
                                        smooth 
                                        to={"#header-" + index} 
                                    >
                                    {header.toText()}
                                    </NavHashLink>
                                </div>
                        )
                    }
                    {/* Link to references */ }
                    {
                        this.props.references ? 
                            <div className={"outline-header outline-header-level-0" + (this.props.headerIndex === this.props.headers.length ? " outline-header-active" : "")}>
                                <NavHashLink smooth to="#references">References</NavHashLink>
                            </div> :
                            null
                    }
                </div>
            </div>
        );
	}

}

export { Outline };