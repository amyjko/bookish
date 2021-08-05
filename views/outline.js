import React from 'react';

import { Link } from 'react-router-dom';
import { NavHashLink } from "react-router-hash-link";

class Outline extends React.Component {

    constructor(props) {
        super(props);

        this.toggle = this.toggle.bind(this);

        this.state = { collapsed: true };

        window.addEventListener('resize', this.layout.bind(this));
		window.addEventListener('scroll', this.layout.bind(this));

    }

    componentWillUnmount() {
		window.removeEventListener('scroll', this.layout);
		window.removeEventListener('resize', this.layout);
	}

    toggle() {
        this.setState({ collapsed: !this.state.collapsed }, () => this.layout());
    }

    // Position outline after first render.
    componentDidMount() {
        this.layout();
    }

    layout() {

		// Update the position of the floating outline
		let outline = document.getElementsByClassName("outline")[0];
		let title = document.getElementsByClassName("title")[0];
		if(outline && title) {

            let inFooter = window.getComputedStyle(outline).getPropertyValue("cursor") === "pointer";

			if(inFooter) {
				outline.style.removeProperty("left");
                outline.style.transform = this.state.collapsed ? "translateY(-4em)" : "translateY(-100%)";
			}
			else {
                outline.style.removeProperty("transform");
				let titleX = title.getBoundingClientRect().left + window.scrollX;
				outline.style.left = titleX + "px";
                this.setState({ collapsed: true });
			}
		}
		
	}

	render() {

        return (
            <div className="outline" onClick={this.toggle} >
                {/* Book navigation links */}
                <div className="outline-header outline-header-level-0">
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
            </div>
        );
	}

}

export { Outline };