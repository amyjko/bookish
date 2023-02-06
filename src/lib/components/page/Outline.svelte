<script lang="ts">
    import { isMobile } from '$lib/util/isMobile';
    import { onMount } from 'svelte';
    import Link from '$lib/components/Link.svelte';
    import { getBase, getDarkMode } from './Contexts';

    export let previous: string | null;
    export let next: string | null;
    export let collapse = false;
    export let listener:
        | ((expanded: boolean, layout: Function) => void)
        | undefined = undefined;

    let headerString: string | null = null;
    let headerIndex = -1;
    let expanded = false;
    let dark = getDarkMode();
    let base = getBase();
    let outline: HTMLElement | null = null;
    let headers: Element[] = [];

    function toggleExpanded() {
        // Don't toggle when in margin mode.
        if (!isMobile()) return;

        const newExpanded = !expanded;

        // Toggle expanded state
        expanded = newExpanded;

        if (listener) listener(newExpanded, layout);
    }

    function toggleReadingMode() {
        dark.set(!$dark);
    }

    function layout() {
        position();
        highlight();
        updateHeaders();
    }

    function updateHeaders() {
        // When the outline updates (due to the page its on updating), generate a unique string for the current header outline.
        // If it's different from the last rendered state, refresh.
        headers = Array.from(document.getElementsByClassName('page-header'));
        let newHeaderString = headers.reduce(
            (sum, el) => sum + el.outerHTML,
            ''
        );

        // If the headers change, update the outline.
        if (headerString !== newHeaderString) headerString = newHeaderString;
    }

    function getHighlightThreshold() {
        return window.innerHeight / 3;
    }

    function position() {
        // Left align the floating outline with the left margin of the chapter
        // and the top of the title, unless we're past it.
        let title = document.getElementsByClassName(
            'bookish-chapter-header-text'
        )[0];

        // If we found them both...
        if (outline && title) {
            // If so, remove the inline position so the footer CSS applies.
            if (isMobile()) {
                outline.style.removeProperty('margin-top');
            }
            // If not, set the position of the outline.
            else {
                let titleY = title.getBoundingClientRect().top + window.scrollY;
                // If the title is off screen, anchor it to the top of the window. (CSS is set to do this).
                if (titleY - 50 < window.scrollY) {
                    outline.classList.add('outline-fixed-left');
                    outline.classList.remove('outline-title-left');
                }
                // Otherwise, anchor it to the title position.
                else {
                    outline.classList.remove('outline-fixed-left');
                    outline.classList.add('outline-title-left');
                }

                // Tell any listeners about the repositioning.
                if (listener) listener(false, layout);
            }
        }
    }

    function highlight() {
        const top = window.scrollY;
        const threshold = getHighlightThreshold();

        // Find the header that we're past so we can update the outline.
        let indexOfNearestHeaderAbove = -1; // -1 represents the title
        Array.from(document.getElementsByClassName('page-header')).forEach(
            (header, index) => {
                // Is this a header we care about?
                if (
                    header.tagName === 'H1' ||
                    header.tagName === 'H2' ||
                    header.tagName === 'H3'
                ) {
                    let rect = header.getBoundingClientRect();
                    let headerTop = rect.y + top - rect.height;
                    // Are we past this header?
                    if (top > headerTop - threshold)
                        indexOfNearestHeaderAbove = index;
                }
            }
        );

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
        document.addEventListener('selectionchange', updateHeaders);

        // Position outline after first render.
        layout();

        // Stop listening!
        return () => {
            window.removeEventListener('scroll', layout);
            window.removeEventListener('resize', layout);
            document.removeEventListener('selectionchange', updateHeaders);
        };
    });

    let previousLabel = '\u25C0\uFE0E';
    let nextLabel = '\u25B6\uFE0E';
    let expandLabel = '\u2630';
    let lightLabel = '\u263C';
    let darkLabel = '\u263E';
</script>

<nav
    bind:this={outline}
    class={'outline ' +
        (!expanded || collapse ? 'outline-collapsed' : 'outline-expanded')}
>
    <!-- Visual cue of expandability, only visible in footer mode. -->
    <div
        class={'outline-collapse-cue' +
            (headers.length === 0 ? ' outline-collapse-cue-disabled' : '')}
        role="button"
        aria-label={expanded
            ? 'Collapse navigation menu'
            : 'Expand navigation menu'}
        tabIndex="0"
        on:click={headers.length > 0 ? toggleExpanded : undefined}
        on:keydown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') toggleExpanded();
        }}
    >
        {expandLabel}
    </div>
    <div class="outline-headers">
        <!-- Book navigation links -->
        <div class="outline-header-nav">
            {#if previous !== null}<Link to="{$base}/{previous}"
                    >{previousLabel}</Link
                >{:else}<span class="outline-header-nav-disabled"
                    >{previousLabel}</span
                >{/if}
            &nbsp;&middot;&nbsp;
            <Link to="{$base}/">Home</Link>
            &nbsp;&middot;&nbsp;
            {#if next !== null}<Link to="{$base}/{next}">{nextLabel}</Link
                >{:else}<span class="outline-header-nav-disabled"
                    >{nextLabel}</span
                >{/if}
        </div>
        <!--  Scan through the headers and add a properly formatted link for each. -->
        {#each headers as header, index}
            <!-- Assumes that all headers have an H1, H2, etc. tag. -->
            {@const level = Number.parseInt(header.tagName.charAt(1))}
            <!-- Only h1, h2, and h3 headers... -->
            {#if level <= 3}
                <Link to={'#' + header.id}>
                    <div
                        class={'outline-header outline-header-level-' +
                            (level - 1) +
                            (headerIndex === index
                                ? ' outline-header-active'
                                : '')}
                    >
                        {header.textContent}
                    </div>
                </Link>
            {/if}
        {/each}
    </div>
    <!-- Dark mode toggle -->
    <div
        class="outline-reading-mode"
        role="button"
        aria-label={$dark === true
            ? 'Switch to light mode'
            : 'Switch to dark mode'}
        tabIndex="0"
        on:click={toggleReadingMode}
        on:keydown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                toggleReadingMode();
                event.stopPropagation();
            }
        }}
    >
        {$dark ? darkLabel : lightLabel}
    </div>
</nav>

<style>
    .outline {
        font-family: var(--bookish-header-font-family);
        font-weight: normal;
        font-size: var(--bookish-paragraph-font-size);
        color: var(--bookish-muted-color);
        --outline-width: 12em;
        --outline-padding: 1em;
        --outline-offset: calc(
            -1 * (var(--outline-width) + 3 * var(--outline-padding))
        );
    }

    .outline-header-nav {
        display: inline-block;
        width: 100%;
        padding-bottom: var(--outline-padding);
    }

    .outline-header {
        display: block;
        line-height: var(--bookish-paragraph-line-height-tight);
        text-indent: 0;
        padding-left: 1rem;
        padding-right: 1rem;
        margin-bottom: 0.75rem;
    }

    .outline-header-level-0 {
        font-size: 1rem;
    }

    .outline-header-level-1 {
        font-size: 0.9rem;
    }

    .outline-header-level-2 {
        font-size: 0.8rem;
        font-style: italic;
        margin-left: 1em;
    }

    :global(a .outline-header),
    :global(.outline-header-nav a) {
        color: var(--bookish-muted-color);
    }

    :global(a .outline-header-active),
    :global(a:hover .outline-header) {
        color: var(--bookish-paragraph-color);
    }

    .outline-header-nav-disabled {
        opacity: 0.3;
    }

    :global(.outline a:hover) {
        text-decoration: none;
    }

    /* Only apply this on devices with hover abilities. */
    @media (hover: hover) {
        :global(.outline a:hover) {
            color: var(--bookish-paragraph-color);
        }
    }

    :global(a .outline-header-active) {
        color: var(--bookish-paragraph-color);
    }

    .outline-reading-mode {
        transition: transform 0.2s ease-in;
    }

    .outline-reading-mode:hover {
        cursor: pointer;
        transform: scale(1.25, 1.25);
        color: var(--bookish-paragraph-color);
    }

    /* Mobile */
    @media screen and (max-width: 1200px) {
        .outline {
            position: fixed;
            top: 100%; /* Put it all the way off screen on the bottom, then let JS translate */
            left: 0;
            right: 0;
            width: 100%;
            z-index: 2; /* Put it above content when it's a sheet in the footer */
            border-top: 1px solid var(--bookish-border-color-light);
            text-align: left;
            transition: transform 0.2s ease-in;
            background-color: var(--bookish-background-color);
            box-shadow: 0px -1px 2px rgba(0, 0, 0, 0.25);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            /* Cap height at window size. If the content is too tall, scroll it. */
            max-height: 100%;
            overflow-y: scroll;
        }

        /* Make a little centered box to store the outline to preserve its left aligned structure, while making it easier to click. */
        .outline-headers {
            width: 20em;
            margin: auto;
        }

        .outline-header-nav {
            text-align: center;
            padding-top: 0.5em; /* Add some spacing when in the footer */
            padding-bottom: 0.5em;
            text-indent: 0 !important; /* Override header default */
            font-size: 1.25rem !important;
        }

        .outline-reading-mode {
            position: absolute;
            top: 0.5em;
            left: 0;
            font-size: 1em;
            display: inline-block;
            padding-left: 1em;
            padding-right: 1em;
        }

        .outline-collapse-cue {
            position: absolute;
            top: 0.5em;
            right: 0;
            font-size: 1em;
            display: inline-block;
            padding-left: 1em;
            padding-right: 1em;
            transition: transform 0.2s ease-in;
        }

        .outline-collapse-cue:hover {
            cursor: pointer;
            transform: scale(1.25, 1.25);
            color: var(--bookish-paragraph-color);
        }

        .outline-collapse-cue-disabled {
            display: none;
        }

        .outline-expanded .outline-collapse-cue {
            transform: rotate(90deg);
        }

        .outline.outline-expanded {
            transform: translateY(-100%);
        }

        .outline.outline-collapsed {
            transform: translateY(-3rem);
        }
    }

    /* Desktop */
    @media screen and (min-width: 1200px) {
        .outline {
            width: var(--outline-width);
            z-index: 0; /* Put it below everything when it's in the margin. */
            border-right: 1px solid var(--bookish-border-color-light);
            padding: var(--outline-padding);
            background-color: var(--bookish-background-color);
            margin-right: var(--outline-padding);
        }

        /* When the outline is fixed to the left, it's translated by it's width (with some padding). */
        /* It's left position is set outline.js. This class is set by outline.js. */
        .outline.outline-fixed-left {
            position: fixed;
            display: inline-block;
            top: 50px;
            transform: translateX(var(--outline-offset));
        }

        /* When the outline is fixed to title, it's positioned absolutely relative to the book container. */
        /* We set a margin appropriate for it's width above. This class is set in Outline.tsx. */
        .outline.outline-title-left {
            position: absolute;
            margin-left: var(--outline-offset);
        }

        .outline-collapse-cue {
            display: none;
        }

        .outline-reading-mode {
            position: absolute;
            top: calc(var(--outline-padding));
            right: calc(var(--outline-padding));
        }
    }
</style>
