<script lang="ts">
    import { onMount } from 'svelte';
    import Loading from '$lib/components/page/Loading.svelte';

	export let title: string;
    export let afterLoaded: Function | undefined = undefined;

	
	let loaded = false;
	let lastHeight = 0;
	let intervalID: NodeJS.Timer | null = null;
    let mountTime = Date.now();

	function watchLoading() {

		const bodyHeight = document.body.clientHeight;

		// If the height hasn't changed and images are loaded OR it's been 2 seconds, load.
		if((lastHeight === bodyHeight && imagesAreLoaded()) || (Date.now() - mountTime) > 2000) {
			// Stop watching the images
			stopWatching();
			// Set to loaded to hide the overlay and notify callback if there is one.
			loaded = true;
            if(afterLoaded)
                afterLoaded();
		}

		// Remember the last height
		lastHeight= bodyHeight;

	}

	function stopWatching() {
		if(intervalID)
			clearInterval(intervalID);
	}

    onMount(() => {

        // Watch the height of the document and wait until it's been stable for a while before scrolling
		// to any targets. We use the data below to monitor the document height over time.
		intervalID = setInterval(() => watchLoading(), 50);
		
		return () => stopWatching();

	});

    function imagesAreLoaded() {
		let done = true;
		Array.from(document.getElementsByTagName("img")).forEach(el => {
			done = done && el.complete;
		});
		return done;
	}

</script>

<svelte:head>
    <title>{title}</title>
    <meta name="description" content={title}>
</svelte:head>

{#if loaded === false }
    <Loading/>
{:else}
    <div class={"bookish-page" + (loaded ? " loaded": "")}>
        <slot></slot>
    </div>
{/if}

<style>
	/* A page, such as table of contents, chapter, or references */
	.bookish-page {
		max-width: 720px;

		/* This helps marginals relative to the page */
		position: relative;

		/* To make room for navigation footer. Without this, the page is too short to show it. */
		padding-left: var(--bookish-block-padding);
		padding-right: var(--bookish-block-padding);
		padding-bottom: 5em;

		/* Center the application in the viewport */
		margin-top: 0;
		margin-left: auto;
		margin-right: auto;

		/* Hidden by default until tagged as loaded */
		opacity: 0;
		transition: opacity 0.25s ease-in;

		z-index: 1;
	}

	.loaded {
		opacity: 1;
	}

</style>