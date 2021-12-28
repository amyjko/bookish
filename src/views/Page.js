import React from 'react';

import { Loading } from './Loading';

class Page extends React.Component {

    constructor(props) {

        super(props);

        this.state = {
			loaded: false
        };

        this.watchLoading = this.watchLoading.bind(this);

        // Watch the height of the document and wait until it's been stable for a while before scrolling
		// to any targets. We use the data below to monitor the document height over time.
		this.loadingMonitor = {
			lastHeight: undefined,
			count: 0,
			intervalID: setInterval(this.watchLoading, 50),
		}
		
		this.watchLoading();

    }

    imagesAreLoaded() {

		let loaded = true;
		Array.from(document.getElementsByTagName("img")).forEach(el => {
			loaded = loaded & el.complete;
		});
		return loaded;

	}

    watchLoading() {

		const bodyHeight = document.body.clientHeight;
		if(this.loadingMonitor.lastHeight === document.body.clientHeight) {
			this.loadingMonitor.count++;
			this.loadingMonitor.lastHeight = document.body.clientHeight;
			if(this.loadingMonitor.count >= 20 || this.imagesAreLoaded()) {
				// Stop watching the images
				this.stopWatching();
				// Set to loaded to hide the overlay and notify callback if there is one.
                this.setState({ loaded: true }, () => this.props.loaded?.call());
			}
		}
		else {
			this.loadingMonitor.lastHeight = bodyHeight;
			this.loadingMonitor.count = 0;
		}

	}

    stopWatching() {

        clearInterval(this.loadingMonitor.intervalID);

    }

    componentWillUnmount() {

        this.stopWatching();

    }

    render() {

        return <div>
            { this.state.loaded ? null : <Loading/> }
            <div className={"page" + (this.state.loaded ? " page-loaded": "")}>
                { this.props.children }
            </div>
        </div>

    }

}

export { Page }