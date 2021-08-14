import React from 'react';

import { Link } from 'react-router-dom';
import { NavHashLink } from "react-router-hash-link";

class Outline extends React.Component {

    constructor(props) {
        super(props);

        this.toggle = this.toggle.bind(this);
        this.layout = this.layout.bind(this);

		this.state = { 
			headerIndex: -1
        };

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

		this.position();
        this.highlight();

	}

    getHighlightThreshold() { return window.innerHeight / 3; }

    position() {

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

    highlight() {

		const top = window.scrollY;
        const threshold = this.getHighlightThreshold();

		// Find the header that we're past so we can update the outline.
		let headers = document.getElementsByClassName("header");
		let indexOfNearestHeaderAbove = -1; // -1 represents the title
		for(let i = 0; i < headers.length; i++) {
			let header = headers[i];
			if(header.tagName === "H2" || header.tagName === "H3") {
				let rect = header.getBoundingClientRect();
				let headerTop = rect.y + top - rect.height;
				if(top > headerTop - threshold)
					indexOfNearestHeaderAbove = i;
			}
		}

		let references = document.getElementById("references");
		if(references) {
			let rect = references.getBoundingClientRect();
			if(top > rect.y + top - rect.height - threshold)
				indexOfNearestHeaderAbove = headers.length;
		}

        // Update the outline and progress bar.
		this.setState({ headerIndex: indexOfNearestHeaderAbove });

    }

    componentDidUpdate(prevProps) {

        if(this.props.expanded !== prevProps.expanded)
            this.layout();

    }

	render() {

        // Scroll the window such that the header is at the top third of the window.
        let topThirdScroll = (el) => {
            // This previous behavior was pretty nice, but if an image is really tall and unrelated to the header, 
            // it would scroll such that the header was out of view.
            // let target = el;
            // if(el.previousSibling && el.previousSibling.classList.contains("figure"))
            //     target = el.previousSibling;
            // window.scrollTo({ top: Math.min(el.getBoundingClientRect().top, target.getBoundingClientRect().top) + window.pageYOffset, behavior: 'smooth' }); 

            // Top of the target minus a third of window height.
            window.scrollTo({ top: el.getBoundingClientRect().top - window.innerHeight / 3 + window.pageYOffset, behavior: 'smooth' }); 
        }

        return (
            <div className={"outline " + (this.props.expanded ? "outline-expanded": "outline-collapsed")} onClick={this.toggle}>
                {/* Visual cue of expandability, only visible in footer mode. */}
                <div className="outline-collapse-cue">▲</div>
                <div className="outline-headers">
                    {/* Book navigation links */}
                    <div className="outline-header outline-header-level-0 outline-header-nav">
                        { this.props.previous ? <span><Link to={"/" + this.props.previous}>Prev</Link></span> : <span>Prev</span> }
                        &nbsp;&middot;&nbsp;
                        <Link to={"/"}>Home</Link>
                        &nbsp;&middot;&nbsp;
                        { this.props.next ? <Link to={"/" + this.props.next}>Next</Link> : <span>Next</span> }
                    </div>

                    {/* Title link */}
                    <NavHashLink scroll={topThirdScroll} to="#title">
                        <div className={"outline-header outline-header-level-0" + (this.state.headerIndex < 0 ? " outline-header-active" : "")}>
                            {this.props.title}
                        </div>
                    </NavHashLink>
                    {/* Header links */}
                    {
                        this.props.headers.map((header, index) => 
                            // Only first and second level headers...
                            header.level > 2 ? 
                                null :
                                <NavHashLink scroll={topThirdScroll} to={"#header-" + index} key={"header-" + index} >
                                    <div className={"outline-header outline-header-level-" + header.level + (this.state.headerIndex === index ? " outline-header-active" : "")}>
                                        {header.toText()}
                                    </div>
                                </NavHashLink>
                        )
                    }
                    {/* Link to references */ }
                    {
                        this.props.references ? 
                            <NavHashLink scroll={topThirdScroll} to="#references">
                                <div className={"outline-header outline-header-level-0" + (this.state.headerIndex === this.props.headers.length ? " outline-header-active" : "")}>
                                    References
                                </div>
                            </NavHashLink> :
                            null
                    }
                </div>
            </div>
        );
	}

}

export { Outline };