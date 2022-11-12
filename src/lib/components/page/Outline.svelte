<script lang="ts">
    import { isMobile } from '$lib/util/isMobile';
    import { getContext, onMount } from 'svelte';
    import Link from '$lib/components/Link.svelte';
    import { BASE, getDarkMode } from './Contexts';

    export let previous: string | null;
    export let next: string | null;
    export let collapse = false;
    export let listener: ((expanded: boolean, layout: Function) => void) | undefined = undefined;

    let headerString: string | null = null;
    let headerIndex = -1;
    let expanded = false;
    let dark = getDarkMode();
    let base = getContext<string>(BASE);
    let outline: HTMLDivElement | null = null;

    function toggleExpanded() {

        // Don't toggle when in margin mode.
        if(!isMobile())
            return;

        const newExpanded = !expanded;

        // Toggle expanded state
        expanded = newExpanded;

        if(listener)
           listener(newExpanded, layout);
    
    }

    function toggleReadingMode() {
        dark.set(!$dark);
    }

    function layout() {

		position();
        highlight();

	}

    function getHeaders(): Element[] {
        return Array.from(document.getElementsByClassName("bookish-header"));
    }

    function updateHeaders() {

        // When the outline updates (due to the page its on updating), generate a unique string for the current header outline.
        // If it's different from the last rendered state, refresh.
        let newHeaderString = "";
        getHeaders().forEach(el => newHeaderString += el.outerHTML);

        // If the headers change, update the outline.
        if(headerString !== newHeaderString)
            headerString = newHeaderString;

    }

    function getHighlightThreshold() { return window.innerHeight / 3; }

    const position = () => {

		// Left align the floating outline with the left margin of the chapter
        // and the top of the title, unless we're past it.
		let title = document.getElementsByClassName("bookish-chapter-header-text")[0];

        // If we found them both...
        if(outline && title) {

            // If so, remove the inline position so the footer CSS applies.
			if(isMobile()) {
                outline.style.removeProperty("margin-top");
			}
            // If not, set the position of the outline.
			else {
                let titleY = title.getBoundingClientRect().top + window.scrollY;
                // If the title is off screen, anchor it to the top of the window. (CSS is set to do this).
                if(titleY - 50 < window.scrollY) {
                    outline.classList.add("bookish-outline-fixed-left");
                    outline.classList.remove("bookish-outline-title-left");
                }
                // Otherwise, anchor it to the title position.
                else {
                    outline.classList.remove("bookish-outline-fixed-left");
                    outline.classList.add("bookish-outline-title-left");
                }

                // Tell any listeners about the repositioning.
                if(listener)
                    listener(false, layout);
			}
		}

    }

    const highlight = () => {

		const top = window.scrollY;
        const threshold = getHighlightThreshold();

		// Find the header that we're past so we can update the outline.
		let indexOfNearestHeaderAbove = -1; // -1 represents the title
        Array.from(document.getElementsByClassName("bookish-header")).forEach((header, index) => {
            // Is this a header we care about?
            if(header.tagName === "H1" || header.tagName === "H2" || header.tagName === "H3") {
				let rect = header.getBoundingClientRect();
				let headerTop = rect.y + top - rect.height;
                // Are we past this header?
                if(top > headerTop - threshold)
					indexOfNearestHeaderAbove = index;
			}
		});

        // Update the outline and progress bar.
		headerIndex = indexOfNearestHeaderAbove;

    }

    onMount(() => {

        window.addEventListener('resize', layout);
		window.addEventListener('scroll', layout);

        // This is a bit hacky: we update the headers on every selection change so we 
        // can detect any header changes during editing. This isn't necessary during
        // reading, and is only necessary when a header is created, updated, or removed,
        // but we don't have a precise mechanism to listen to chapter changes, so we do this instead.
        document.addEventListener("selectionchange", updateHeaders);

        // Update the headers.
        updateHeaders();

        // Position outline after first render.
        layout();


        // Stop listening!
        return () => {
            window.removeEventListener('scroll', layout);
            window.removeEventListener('resize', layout);
            document.removeEventListener("selectionchange", updateHeaders);
        }

    });
    
    let previousLabel = "\u25C0\uFE0E";
    let nextLabel = "\u25B6\uFE0E";
    let expandLabel = "\u2630";
    let lightLabel = "\u263C";
    let darkLabel = "\u263E";

    // Scan for headers and put them into a stable list.
    let headers: Element[] = getHeaders();

</script>

<div 
    bind:this={outline}
    class={"bookish-outline " + (!expanded || collapse ? "bookish-outline-collapsed": "bookish-outline-expanded")}
>
    <!-- Dark mode toggle -->
    <div 
        class="bookish-outline-reading-mode" 
        role="button"
        aria-label={$dark === true ? "Switch to light mode" : "Switch to dark mode"}
        tabindex=0
        on:click={toggleReadingMode}
        on:keydown|preventDefault={event => /^(Enter|\s)$/.test(event.key) ? toggleReadingMode() : undefined }
    >
        {$dark ? darkLabel : lightLabel}
    </div>
    <!-- Visual cue of expandability, only visible in footer mode. -->
    <div 
        class={"bookish-outline-collapse-cue" + (headers.length === 0 ? " bookish-outline-collapse-cue-disabled" : "") }
        role="button" 
        aria-label={expanded ? "Collapse navigation menu" : "Expand navigation menu"}
        tabindex=0
        on:click={headers.length > 0 ? toggleExpanded : undefined }
        on:keydown|preventDefault={event => /^(Enter|\s)$/.test(event.key) ? toggleExpanded() : undefined }
    >
        { expandLabel }
    </div>
    <div class="bookish-outline-headers">

        <!-- Book navigation links -->
        <div class="bookish-outline-header-nav">
            {#if previous !== null}<Link to={base + "/" + previous}>{previousLabel}</Link>{:else}<span class="bookish-outline-header-nav-disabled">{previousLabel}</span>{/if}
            &nbsp;&middot;&nbsp;
            <Link to={base + "/"}>Home</Link>
            &nbsp;&middot;&nbsp;
            {#if next !== null}<Link to={base + "/" + next}>{nextLabel}</Link>{:else}<span class="bookish-outline-header-nav-disabled">{nextLabel}</span>{/if}
        </div>
        <!--  Scan through the headers and add a properly formatted link for each. -->
        {#each headers as header, index }
            <!-- Assumes that all headers have an H1, H2, etc. tag. -->
            {@const level = Number.parseInt(header.tagName.charAt(1)) }
            <!-- Only h1, h2, and h3 headers... -->
            {#if level <= 3 }
                <Link to={"#" + header.id}>
                    <div class={"bookish-outline-header bookish-outline-header-level-" + (level - 1) + (headerIndex === index ? " bookish-outline-header-active" : "")}>
                        {header.textContent}
                    </div>
                </Link>
            {/if}
        {/each}
    </div>
</div>