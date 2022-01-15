import React, { useState, useContext, useEffect, useRef } from 'react';

import { Link, NavLink } from 'react-router-dom';
import { HashLink } from '../util/HashLink';

import smoothlyScrollElementToEyeLevel from '../util/Scroll';
import { isMobile } from '../util/isMobile';
import { DarkModeContext } from './Book';
import { BaseContext } from './Book';

const Outline = (props: { previous: string | null, next: string | null, collapse?: boolean, listener?: Function }) => {

    let [ headerString, setHeaderString ] = useState<string | null>(null)
    let [ headerIndex, setHeaderIndex ] = useState<number>(-1)
    let [ expanded, setExpanded ] = useState<boolean>(false)
    let { darkMode, setDarkMode } = useContext(DarkModeContext)
    const { base } = useContext(BaseContext)
    let outline = useRef<HTMLDivElement>(null)

    function toggleExpanded() {

        // Don't toggle when in margin mode.
        if(!isMobile())
            return;

        const newExpanded = !expanded;

        // Toggle expanded state
        setExpanded(newExpanded)

        if(props.listener)
            props.listener.call(null, newExpanded, layout);
    
    }

    function toggleReadingMode() {
    
        if(setDarkMode)
            setDarkMode(!darkMode)

    }

    function layout() {

		position();
        highlight();

	}

    function getHighlightThreshold() { return window.innerHeight / 3; }

    const position = () => {

		// Left align the floating outline with the left margin of the chapter
        // and the top of the title, unless we're past it.
		let title = document.getElementsByClassName("bookish-chapter-header-text")[0];

        // If we found them both...
        if(outline.current && title) {

            // If so, remove the inline position so the footer CSS applies.
			if(isMobile()) {
                outline.current.style.removeProperty("margin-top");
			}
            // If not, set the position of the outline.
			else {
                let titleY = title.getBoundingClientRect().top + window.scrollY;
                // If the title is off screen, anchor it to the top of the window. (CSS is set to do this).
                if(titleY - 50 < window.scrollY) {
                    outline.current.classList.add("bookish-outline-fixed-left");
                    outline.current.classList.remove("bookish-outline-title-left");
                }
                // Otherwise, anchor it to the title position.
                else {
                    outline.current.classList.remove("bookish-outline-fixed-left");
                    outline.current.classList.add("bookish-outline-title-left");
                }

                // Tell any listeners about the repositioning.
                if(props.listener)
                    props.listener.call(undefined, false);
			}
		}

    }

    const highlight = () => {

		const top = window.scrollY;
        const threshold = getHighlightThreshold();

		// Find the header that we're past so we can update the outline.
		let indexOfNearestHeaderAbove = -1; // -1 represents the title
        let nearbyHeader = null;
        Array.from(document.getElementsByClassName("bookish-header")).forEach((header, index) => {
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
		setHeaderIndex(indexOfNearestHeaderAbove)

    }

    useEffect(() => {

        window.addEventListener('resize', layout);
		window.addEventListener('scroll', layout);

        // Position outline after first render.
        layout();

        // Stop listening!
        return () => {

            window.removeEventListener('scroll', layout);
            window.removeEventListener('resize', layout);
    
        }

    }, [])

    useEffect(() => {

        // When the outline updates (due to the page its on updating), generate a unique string for the current header outline.
        // If it's different from the last rendered state, refresh.
        let newHeaderString = "";
        Array.from(document.getElementsByClassName("bookish-header")).forEach(el => newHeaderString += el.outerHTML);

        // If the headers change, update the outline.
        if(headerString !== newHeaderString)
            setHeaderString(newHeaderString)

    })
    
    let previous = "\u25C0\uFE0E";
    let next = "\u25B6\uFE0E";
    let expand = "\u2630";
    let light = "\u263C";
    let dark = "\u263E";

    // Scan for headers and put them into a stable list.
    let headers: Element[] = [];
    Array.from(document.getElementsByClassName("bookish-header")).forEach(el => headers.push(el));

    return (
        <div 
            ref={outline}
            className={"bookish-outline " + (!expanded || props.collapse ? "bookish-outline-collapsed": "bookish-outline-expanded")}
        >
            {/* Dark/light mode toggle */}
            <div 
                className="bookish-outline-reading-mode" 
                role="button"
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                onClick={toggleReadingMode}
            >
                {darkMode ? dark : light}
            </div>
            {/* Visual cue of expandability, only visible in footer mode. */}
            <div 
                className={"bookish-outline-collapse-cue" + (headers.length === 0 ? " bookish-outline-collapse-cue-disabled" : "") }
                role="button" 
                aria-label={expanded ? "Collapse navigation menu" : "Expand navigation menu"}
                onClick={headers.length > 0 ? toggleExpanded : undefined }
            >
                { expand }
            </div>
            <div className="bookish-outline-headers">

                {/* Book navigation links */}
                <div className="bookish-outline-header-nav">
                    { props.previous !== null ? <Link to={base + "/" + props.previous}>{previous}</Link> : <span className="bookish-outline-header-nav-disabled">{previous}</span> }
                    &nbsp;&middot;&nbsp;
                    <Link to={base + "/"}>Home</Link>
                    &nbsp;&middot;&nbsp;
                    { props.next !== null ? <Link to={base + "/" + props.next}>{next}</Link> : <span className="bookish-outline-header-nav-disabled">{next}</span> }
                </div>

                {
                    // Scan through the headers and add a properly formatted link for each.
                    headers.map((header, index) => {

                        // Assumes that all headers have an H1, H2, etc. tag.
                        const level = Number.parseInt(header.tagName.charAt(1));

                        // Only h1, h2, and h3 headers...
                        return level > 3 ? 
                            null :
                            <HashLink scroll={smoothlyScrollElementToEyeLevel} to={"#" + header.id} key={"header-" + index} >
                                <div className={"bookish-outline-header bookish-outline-header-level-" + (level - 1) + (headerIndex === index ? " bookish-outline-header-active" : "")}>
                                    {header.textContent}
                                </div>
                            </HashLink>
                        }
                    )
                }
            </div>
        </div>
    );
}

export default Outline