<script lang="ts">
    import Parser from "$lib/models/chapter/Parser"
    import type ChapterModel from '$lib/models/book/Chapter'

    import Header from '$lib/components/page/Header.svelte'
    import Authors from "$lib/components/page/Authors.svelte"
    import Outline from '$lib/components/page/Outline.svelte'
    import Page from '$lib/components/page/Page.svelte'
    import TextEditor from '$lib/components/editor/TextEditor.svelte';
    import BookishEditor from '$lib/components/editor/BookishEditor.svelte';
    import Toggle from '$lib/components/editor/Toggle.svelte';
    import Instructions from '$lib/components/page/Instructions.svelte';
    import ChapterBody from '$lib/components/chapter/ChapterBody.svelte';
    import PossibleReference from "./PossibleReference.svelte";

    import { CHAPTER, getEdition, isEditable, type ChapterStore } from "./Contexts";
    import { writable } from "svelte/store";
    import { onMount, setContext } from "svelte";
    import { hideOutlineIfObscured, layoutMarginals } from "./margins";
    import scrollToEyeLevel from "../../util/scrollToEyeLevel";
    import type ChapterContext from "$lib/components/page/ChapterContext";
    import { goto } from "$app/navigation";
    import type Chapter from "$lib/models/book/Chapter";
    import ChapterNode from "$lib/models/chapter/ChapterNode";

    export let chapter: ChapterModel;
    export let print: boolean = false;

    let edition = getEdition();
    let editable = isEditable();

	// Keep track of the scroll position to facilitate reading during reloads.
	function rememberPosition() { localStorage.setItem('scrollposition', "" + window.scrollY); }

	// When the window resizes, the responsive layout might cause the marginals to move to the footer.
	// when this happens, we want to immediately remove all of the explicit positioning.
	function handleResize() { layoutMarginals(); }
	
	// The currently selected marginal; we only do one at a time.
	let marginal: string | undefined = undefined;

	// Keep track of which hash mark is scrolled to
	let highlightedID: string | undefined = undefined;

	// When this component is mounted...
	// 1) Subscribe and unsubscribe to window listeners
	// 2) Do initial layout of marginals
	// 3) Start observing any elements corresponding to the ID in the URL's hash string
	// 4) Clean up our mess after unmounting.
	onMount(() => {

		// On render or when scrolling, see if the URL hash has changed and update state accordingly.
		// We also track whether we've scrolled to it.
		const observeHash = () => {
			// Get the ID without the hash and the corresponding element
			const elementID = window.location.hash.substring(1)
			const element = elementID ? document.getElementById(elementID) : null

			// If it's not empty, observe it, and remember what we're observing for highlighting
			if(element) {
				highlightedID = elementID;
				// Start watching this a few seconds after we see it, giving the for in-page scrolling.
				setTimeout(() => observer.observe(element), 2500)
			}
		}

		// Do things to do when scrolling
		const handleScroll = () => {

			// See if the outline is obscured by an image
			hideOutlineIfObscured()

			// See if there are any new hashes to observe. This is because
			// we're using react-router-hash-link, which doesn't trigger hashchange events for some reason.
			observeHash()
			
		}

		// Lay things out when the window or scroll changes.
		window.addEventListener('scroll', handleScroll)
		window.addEventListener('resize', handleResize)

		// Remember the scroll position before a refresh.
		// We have to do all of these because browser support varies.
		window.addEventListener("beforeunload", rememberPosition)
		window.addEventListener("visibilitychange", rememberPosition)
		window.addEventListener("pagehide", rememberPosition)
		
		// Start listening for hash changes, since we want to remove them upon scrolling away from them.
		window.addEventListener("pushstate", observeHash)
		window.addEventListener("popstate", observeHash)
		window.addEventListener("hashchange", observeHash)

		// Make an intersection observer to monitor the location of elements selected by the URL hash ID.
		const observer = new IntersectionObserver((entries => {
			// Go through all of the monitored elements
			entries.forEach(entry => {
				// If the observed element is out of view and in the hash, remove the hash 
				if(entry.intersectionRatio === 0 && entry.target.id === window.location.hash.substring(1)) {
					history.pushState("", document.title, window.location.pathname + window.location.search)
					observer.unobserve(entry.target)					
					highlightedID = undefined;
				}
			})
		}))
		
		// Do an initial check the hash to see if there's an ID to scroll to
		observeHash();

		// Position the marginals, since there's new content.
		layoutMarginals();

		// Periodically save the chapter's edits.
		const chapterSaverID = setInterval(() => {
			$currentChapter.saveEdits();
		}, 500);

		// On cleanup, unsubscribe from everything above.
		return () => {

			window.removeEventListener('scroll', handleScroll)
			window.removeEventListener('resize', handleResize)
	
			// Stop listening to page visibility changes.
			window.removeEventListener("beforeunload", rememberPosition)
			window.removeEventListener("visibilitychange", rememberPosition)
			window.removeEventListener("pagehide", rememberPosition)
	
			// Delete the remembered position so that the next page scrolls to top.
			localStorage.removeItem("scrollposition")

			// Stop listening for hash changes
			window.removeEventListener("pushstate", observeHash)
			window.removeEventListener("popstate", observeHash)
			window.removeEventListener("hashchange", observeHash)

			// Stop observing everything on unmount
			observer.disconnect()

			// Stop saving.
			clearInterval(chapterSaverID);
		}

	});
	
	// Position the marginals on mount.
	onMount(() => layoutMarginals());

    // Keep track of the current chapter in a store to manage listeners on the chapter.
    let currentChapter = writable<Chapter>(chapter);
    let chapterChanged = () => currentChapter.set(chapter);
    $: {
        // Listen to the new edition
        $currentChapter.removeListener(chapterChanged)
        // Update the current edition.
        currentChapter.set(chapter);
		// Listen to changes on the book and chapter.
		$currentChapter.addListener(chapterChanged);
    }

	// Get the word and number to highlight from the URL
	let word: string = "";
    let number: string = "";

	// This gets called after the page is done loading. There are various things we scroll to.
	function scrollToLastLocation() {

		// In case loading changed marginal positions
		layoutMarginals();

		// If there's a word we're trying to highlight in the URL path, scroll to the corresponding match.
		if(word && number) {
			const highlights = document.getElementsByClassName("bookish-text bookish-content-highlight")
			const num = parseInt(number)
			if(highlights.length > 0 && num < highlights.length && num >= 0) {
				scrollToEyeLevel(highlights[num])
			}
		}
		// Otherwise, if there's an ID in the URL, jump to it.
		else if(highlightedID) {
			const el = document.getElementById(highlightedID as string)
			// If we found the element, remove the hash any time after a few seconds. See handleScroll for the removal logic.
			if(el) {
				scrollToEyeLevel(el)
			}
		}
		else {			
			// If we got to this page through a refresh, scroll to 
			const entries = performance.getEntriesByType("navigation");
			const position = localStorage.getItem('scrollposition');
			if(position !== null && entries.length > 0 && (entries[entries.length - 1] as PerformanceNavigationTiming).type === "reload") {
				// Scroll to the previous position, if there was one, so that refresh preserves position.
				window.scrollTo(0, parseInt(position));
			} 
			// Otherwise, just scroll to the top.
			else {
				window.scrollTo(0, 0);
			}
		}

	}

	// Prepare to render the chapter by getting some data from the chapter and book.
	$: chapterID = $currentChapter.getChapterID();
	$: chapterNumber = $edition.getChapterNumber(chapterID);
	$: chapterSection = $edition.getChapterSection(chapterID);
	$: chapterAST = $currentChapter.getAST();
	$: citations = chapterAST ? chapterAST.getCitations() : undefined;

    let chapterStore = writable<ChapterContext>();
    setContext<ChapterStore>(CHAPTER, chapterStore);
    $: chapterStore.set({
        chapter: chapter,
        highlightedWord: word,
        highlightedID: highlightedID,
        marginalID: marginal,
        setMarginal: (id: string | undefined) => marginal = id,
        layoutMarginals: layoutMarginals
    });

</script>

<Page afterLoaded={scrollToLastLocation} title={`${$edition.getTitle()} - ${chapter.getTitle()}`}>
    <div class="bookish-chapter">
        <Header 
            header={chapter.getTitle()}
            label="Chapter title"
            tags={$edition.getTags()}
            save={ text => chapter.setTitle(text) }
            getImage={() => chapter.getImage()}
            setImage={embed => chapter.setImage(embed)}
            print={print}
        >
            <!-- Collapse the outline if a marginal is selected. -->
            <Outline
                slot="outline"
                collapse={marginal !== undefined}
                previous={$edition.getPreviousChapterID(chapterID)}
                next={$edition.getNextChapterID(chapterID)}
                listener={ expanded => {
                    // If the outline is being expanded, hide the marginal, otherwise leave it alone.
                    if(expanded)
                        marginal = undefined;

                    // Check if we need to hide the outline after positioning.
                    hideOutlineIfObscured();
                }}
            />
            <!-- Add an editable chapter ID if in editor mode -->
            <span slot="before">
                {#if editable }
                    <span class="bookish-muted">
                        <TextEditor 
                            startText={chapter.getChapterID()} 
                            label="Chapter URL ID editor"
                            save={ 
                                // After the ID is edited, reload the page with the new URL.
                                id => chapter.setChapterID(id)?.then(() => {
                                    const ref = $edition.getRef();
                                    if(ref?.id)
                                        goto(`/write/${ref?.id}/chapter/${id}`)
                                })
                            }
                            placeholder="chapter ID"
                            valid={(newChapterID) => 
                                !/^[a-zA-Z0-9]+$/.test(newChapterID) ? "Chapter IDs must be one or more letters or numbers" :
                                chapter.getChapterID() !== newChapterID && $edition.hasChapter(newChapterID) ? "There's already a chapter that has this ID." :
                                undefined
                            }
                            saveOnExit={true}
                        />
                        <br/>
                    </span>
                {/if}
                {#if editable }
                    <Toggle on={chapter.isNumbered()} save={ on => chapter.setNumbered(on) }>
                        {#if chapterNumber !== undefined }
                            <span class="bookish-chapter-number">Chapter {chapterNumber}</span>
                        {:else}
                            <span class="bookish-muted">Unnumbered</span>
                        {/if}
                    </Toggle>
                {:else if chapterNumber !== undefined }
                    <span class="bookish-chapter-number">Chapter {chapterNumber}</span> 
                {/if}
                {#if chapterSection !== undefined }
                    <span class="bookish-section-name">&nbsp;&nbsp;{chapterSection}</span>
                {/if}
            </span>						
            <!-- If there are chapter authors, render those, otherwise use the book authors -->
            <Authors 
                slot="after"
                authors={ chapter.getAuthors() }
                inheritedAuthors={ $edition.getAuthors() }
                add={ () => chapter.addAuthor("") }
                edit={(index, text) => chapter.setAuthor(index, text) }
                remove={index => chapter.removeAuthor(index)}
            />
        </Header>
        <!-- We load this on the page but hide it; it's used as a filter for highlighing in CSS -->
        <img src={"/svg/marker.svg"} alt="highlight mark" style="display: none"/>
        <Instructions>
            Edit your chapter's title, authors, and cover image above.
            You can also change the ID of the chapter, which appears in it's URL.
            Write your chapter text below, using the many formatting options in the toolbar above to format text, add headers, lists, tables, comments, citations, footnotes, and more.
            It's okay to try things, you can always undo!
            Saves are automatic, each time you stop typing.
        </Instructions>

        <!-- Render the chapter body, passing some context -->
        {#if chapterAST }
            {#if editable }
                <BookishEditor
                    ast={chapterAST}
                    save={ node => node instanceof ChapterNode ? chapter.setAST(node) : undefined }
                    chapter={true}
                    autofocus
                    component={ChapterBody}
                    placeholder="Type here"
                /> 
            {:else}
                <ChapterBody node={chapterAST} />
            {/if}
        {:else}
            <span>Loading...</span>
        {/if}
        {#if citations && citations.size > 0 }
            {@const refs = $edition.getReferences() }
            <h1 id="references" class="bookish-header">References</h1>
            <ol>
                {#each [...citations].sort() as citationID }
                    {#if citationID in refs }
                        <li class={"bookish-reference"} id={"ref-" + citationID}>
                            <PossibleReference node={Parser.parseReference(citationID, refs[citationID], $edition)}/>
                        </li>
                    {:else}
                        <li class="bookish-error">Unknown reference: <code>{citationID}</code></li>
                    {/if}
                {/each}
            </ol>
        {/if}
    </div>
</Page>