import React from 'react';

import { Link } from 'react-router-dom';
import { NavHashLink } from "react-router-hash-link";

import { smoothlyScrollElementToEyeLevel } from './../views/scroll.js';

class Outline extends React.Component {

    constructor(props) {
        super(props);

        this.toggle = this.toggle.bind(this);
        this.layout = this.layout.bind(this);

		this.state = { 
            headers: null,
			headerIndex: -1,
            expanded: false // This state gets overridden if a container is passed in to manage state.
        };
    
    }

    toggle() {

        // Don't toggle when in margin mode.
        if(!this.inFooter())
            return;

        const newExpanded = !this.state.expanded;

        // Toggle expanded state
        this.setState({ 
            expanded: newExpanded,
        }, this.layout);

        // Notify if given a listener.
        if(this.props.listener)
            this.props.listener.call(this, newExpanded, this.layout);
    
    }

    inFooter() {

        let outline = document.getElementsByClassName("outline")[0];
        if(outline)
            return window.getComputedStyle(outline).getPropertyValue("cursor") === "pointer";
        else
            return false;

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

    componentDidUpdate() {

        // When this updates, generate a unique string for the current header outline.
        // If it's different from the last rendered state, refresh.
        let headers = "";
        Array.from(document.getElementsByClassName("header")).forEach(el => headers += el.outerHTML);

        // If the headers change, update the outline.
        if(this.state.headers !== headers)
            this.setState({ headers: headers});

    }

    layout() {

		this.position();
        this.highlight();

	}

    getHighlightThreshold() { return window.innerHeight / 3; }

    position() {

		// Left align the floating outline with the left margin of the chapter
        // and the top of the title, unless we're past it.
		let outline = document.getElementsByClassName("outline")[0];
		let title = document.getElementsByClassName("chapter-header-text")[0];

        // If we found them both...
        if(outline && title) {

            // If so, remove the inline position so the footer CSS applies.
			if(this.inFooter()) {
                outline.style.removeProperty("margin-top");
			}
            // If not, set the position of the outline.
			else {
                let titleY = title.getBoundingClientRect().top + window.scrollY;
                // If the title is off screen, anchor it to the top of the window. (CSS is set to do this).
                if(titleY - 50 < window.scrollY) {
                    outline.style.removeProperty("margin-top");
                    outline.classList.add("outline-fixed-left");
                    outline.classList.remove("outline-title-left");
                }
                // Otherwise, anchor it to the title position.
                else {
                    outline.style.marginTop = "-" + document.getElementsByClassName("chapter-header-text")[0].getBoundingClientRect().height + "px"
                    outline.classList.remove("outline-fixed-left");
                    outline.classList.add("outline-title-left");
                }

                // Tell any listeners about the repositioning.
                if(this.props.listener)
                    this.props.listener.call(this, false);
			}
		}

    }

    highlight() {

		const top = window.scrollY;
        const threshold = this.getHighlightThreshold();

		// Find the header that we're past so we can update the outline.
		let indexOfNearestHeaderAbove = -1; // -1 represents the title
        let nearbyHeader = null;
        Array.from(document.getElementsByClassName("header")).forEach((header, index) => {
            // Is this a header we care about?
            if(header.tagName === "H1" || header.tagName === "H2" || header.tagName === "H3") {
				let rect = header.getBoundingClientRect();
				let headerTop = rect.y + top - rect.height;
                // Are we past this header?
                if(top > headerTop - threshold)
					indexOfNearestHeaderAbove = index;
                // Are we within 
                if(Math.abs(headerTop - top) < threshold)
                    nearbyHeader = header;
			}
		});

        // Update the outline and progress bar.
		this.setState({ headerIndex: indexOfNearestHeaderAbove });

    }

	render() {

        // Scan for headers and put them into a stable list.
        let headers = [];
        Array.from(document.getElementsByClassName("header")).forEach(el => headers.push(el));

        return (
            <div className={"outline " + (!this.state.expanded || this.props.collapse ? "outline-collapsed": "outline-expanded")} onClick={this.toggle}>
                {/* Visual cue of expandability, only visible in footer mode. */}
                <div className="outline-collapse-cue">▲</div>
                <div className="outline-headers">

                    {/* Book navigation links */}
                    <div className="outline-header outline-header-level-0 outline-header-nav">
                        { this.props.previous !== null ? <span><Link to={"/" + this.props.previous}>Prev</Link></span> : <span>Prev</span> }
                        &nbsp;&middot;&nbsp;
                        <Link to={"/"}>Home</Link>
                        &nbsp;&middot;&nbsp;
                        { this.props.next !== null ? <Link to={"/" + this.props.next}>Next</Link> : <span>Next</span> }
                    </div>

                    {
                        // Scan through the headers and add a properly formatted link for each.
                        headers.map((header, index) => {

                            // Assumes that all headers have an H1, H2, etc. tag.
                            const level = Number.parseInt(header.tagName.charAt(1));

                            // Only h1, h2, and h3 headers...
                            return level > 3 ? 
                                null :
                                <NavHashLink scroll={smoothlyScrollElementToEyeLevel} to={"#" + header.id} key={"header-" + index} >
                                    <div className={"outline-header outline-header-level-" + (level - 1) + (this.state.headerIndex === index ? " outline-header-active" : "")}>
                                        {header.textContent}
                                    </div>
                                </NavHashLink>
                            }
                        )
                    }
                </div>
            </div>
        );
	}

}

export { Outline };