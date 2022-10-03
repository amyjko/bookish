import React, { useState, useEffect } from 'react';
import Loading from './Loading';

const Page = (props: { afterLoaded?: Function, children: React.ReactNode | React.ReactNode[] }) => {

	const [ loaded, setLoaded ] = useState<boolean>(false)
	const [ lastHeight, setLastHeight] = useState<number>(0)
	const [ intervalID, setIntervalID ] = useState<NodeJS.Timer | null>(null)
	const [ count, setCount ] = useState<number>(0)
	const [ mountTime ] = useState<number>(Date.now())

	function watchLoading() {

		const bodyHeight = document.body.clientHeight;

		// If the height hasn't changed and images are loaded OR it's been 2 seconds, load.
		if((lastHeight === bodyHeight && imagesAreLoaded()) || (Date.now() - mountTime) > 2000) {
			// Stop watching the images
			stopWatching();
			// Set to loaded to hide the overlay and notify callback if there is one.
			setLoaded(true)
		}
		// Reset the count.
		else {
			setCount(0);
		}

		// Remember the last height
		setLastHeight(bodyHeight);

	}

	function stopWatching() {

		if(intervalID)
			clearInterval(intervalID);

	}

	// If the page is loaded, call the callback
	useEffect(() => {
		if(loaded)
			props.afterLoaded?.call(undefined)
	}, [loaded])

	useEffect(() => {

        // Watch the height of the document and wait until it's been stable for a while before scrolling
		// to any targets. We use the data below to monitor the document height over time.
		setIntervalID(setInterval(() => setCount(count => count + 1), 50))
		
		return () => stopWatching();

	}, [])

	// Every time count changes (from the set interval above), check the image loading state
	useEffect(() => {

		watchLoading()

	}, [ count ])

    function imagesAreLoaded() {

		let done = true;
		Array.from(document.getElementsByTagName("img")).forEach(el => {
			done = done && el.complete;
		});
		return done;

	}

	return <>
		{ loaded ? null : <Loading/> }
		<div className={"bookish-page" + (loaded ? " bookish-page-loaded": "")}>
			{ props.children }
		</div>
	</>

}

export default Page