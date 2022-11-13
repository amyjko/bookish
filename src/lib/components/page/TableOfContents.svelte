<script lang="ts">
    import Instructions from "$lib/components/page/Instructions.svelte";
    import Parser from "$lib/models/chapter/Parser";
    import TableOfContentsRow from "./TableOfContentsRow.svelte";
    import ChapterIDs from "$lib/models/book/ChapterID";
    import Page from "$lib/components/page/Page.svelte";
    import Header from "$lib/components/page/Header.svelte";
    import Outline from "$lib/components/page/Outline.svelte";
    import Link from "$lib/components/Link.svelte";
    import SubdomainEditor from "$lib/components/page/SubdomainEditor.svelte";
    import Description from "./Description.svelte";
    import Acknowledgements from "./Acknowledgements.svelte";
    import License from "$lib/components/page/License.svelte";
    import Revisions from "./Revisions.svelte";
    import Authors from "$lib/components/page/Authors.svelte";
    import TextEditor from "$lib/components/editor/TextEditor.svelte";
    import Toggle from "$lib/components/editor/Toggle.svelte";
    import { getBase, getBook, getEdition, isEditable } from "./Contexts";

    let edition = getEdition();
    let book = getBook();
	let base = getBase();
	let editable = isEditable();

	function getProgressDescription(progress: null | number) {

		if(progress === null)
			return "";
		else if(progress === 0)
			return "";
		else if(progress < 30)
			return "; just started";
		else if(progress < 70)
			return "; halfway";
		else if(progress < 95)
			return "; almost done";
		else
			return "; done";

	}

	// Get the chapter progress
	let progressStorage = localStorage.getItem("chapterProgress");
	let progress = progressStorage === null ?
		{} :
		JSON.parse(progressStorage)

	// Is there a colon? Let's make a subtitle
    $: title = $edition.getTitle();
	let subtitle: string | undefined = undefined;
	$: {
    	let colon = title.indexOf(":");
        if(colon >= 0) {
            subtitle = title.substring(colon + 1).trim();
            title = title.substring(0, colon).trim();
        }
    }

    let waitingForChapter = false;

    function addChapter() {
        waitingForChapter = true;
        $edition.addChapter().then(() => waitingForChapter = false);
	}

</script>

<svelte:head>
    <title>{$edition.getTitle()}</title>
    <meta name="description" content={$edition.getTitle()}>
</svelte:head>

<Page title={$edition.getTitle()}>
    <Header 
        label="Book title"
        getImage={() => $edition.getImage("cover")}
        setImage={embed => $edition.setImage("cover", embed)}
        header={title}
        subtitle={subtitle}
        tags={$edition.getTags()}
        save={text => $edition.setTitle(text)}
    >
        {#if editable }
            <SubdomainEditor slot="before"/>
        {/if}
        <Outline slot="outline"
            previous={null}
            next={$edition.getNextChapterID("")}
        />
        <Authors slot="after" 
            authors={$edition.getAuthors()}
            add={ () => $edition.addAuthor("")}
            edit={(index, text) => $edition.setAuthor(index, text) } 
            remove={index => $edition.removeAuthor(index)}
        />
    </Header>

    <Instructions>
        Above you can edit your book's authors, title, and cover image.
    </Instructions>

    <Description/>

    <Instructions>
        This will appear on the <Link to={base + "/read"}>book browsing</Link> page and in your table of contents.
        Write an informative description of what your book is about.
    </Instructions>

    <h2 class="bookish-header" id="chapters">Chapters {#if editable}<button disabled={waitingForChapter} on:click={addChapter}>+</button>{/if}</h2>

    <Instructions>
        Add, remove, and reorder chapters here.
        You can add optional book sections to each chapter, toggle chapters as numbered/unnumbered or published/forthcoming.
        Click the title to edit the chapter.
    </Instructions>

    <div class="bookish-table">
        <table id="toc">
            <tbody>
                {#each $edition.getChapters() as chapter }
                    {@const chapterID = chapter.getChapterID() }
                    {@const readingTime = chapter.getReadingTime() }
                    {@const readingEstimate =
                            readingTime === undefined ? "Forthcoming" :
                            readingTime < 5 ? "<5 min read" :
                            readingTime < 60 ? "~" + Math.floor(readingTime / 5) * 5 + " min read" :
                            "~" + Math.floor(readingTime / 60) + " hour read" }
                    {@const section = chapter.getSection() }
                    {@const etc = readingEstimate + (!chapter.isForthcoming() ? getProgressDescription(chapterID in progress ? progress[chapterID] : null) : "") }

                    <TableOfContentsRow
                        chapter={chapter}
                        chapterID={chapterID}
                        number={$edition.getChapterNumber(chapterID)}
                        title={chapter.getTitle()}
                        forthcoming={chapter.isForthcoming()}
                    >
                        <span slot="annotation">
                            {#if editable }
                                <TextEditor
                                    label={"Chapter section editor"}
                                    startText={section ? section : ""}
                                    placeholder="Section"
                                    valid={ () => undefined }
                                    save={text => chapter.setSection(text) }
                                />
                            {:else}
                                {chapter.getSection()}
                            {/if}
                        </span>
                        <span slot="etc">
                            {#if editable}
                                <Toggle on={chapter.isForthcoming()} save={on => chapter.setForthcoming(on)}>
                                    {etc}
                                </Toggle>
                            {:else}
                                { etc }
                            {/if}
                        </span>
                    </TableOfContentsRow>
                {/each}
                {#if $edition.hasReferences() || editable }
                    <TableOfContentsRow
                        chapterID={ChapterIDs.ReferencesID}
                        title="References"
                        backmatter
                    >
                        <span slot="annotation">Everything cited</span>
                    </TableOfContentsRow>
                {/if}
                {#if $edition.getGlossary() && Object.keys($edition.getGlossary()).length > 0 || editable }
                    <TableOfContentsRow
                        chapterID={ChapterIDs.GlossaryID}
                        title="Glossary"
                        backmatter
                    > 
                        <span slot="annotation">Definitions</span>
                    </TableOfContentsRow>
                {/if}
                <TableOfContentsRow
                    chapterID={ChapterIDs.IndexID}
                    title="Index"
                    backmatter
                > 
                    <span slot="annotation">Common words and where they are</span>
                </TableOfContentsRow>
                <TableOfContentsRow
                    chapterID={ChapterIDs.SearchID}
                    title="Search"
                    backmatter
                > 
                    <span slot="annotation">Find where words occur</span>
                </TableOfContentsRow>

                <TableOfContentsRow
                    chapterID={ChapterIDs.MediaID}
                    title="Media"
                    backmatter
                > 
                    <span slot="annotation">Images and video in the book</span>
                </TableOfContentsRow>
                {#if editable }
                    <TableOfContentsRow
                        chapterID="theme"
                        title="Theme"
                        backmatter
                    > 
                        <span slot="annotation">Style the book</span>
                    </TableOfContentsRow>
                    <TableOfContentsRow
                        chapterID="unknown"
                        title="Unknown"
                        backmatter
                    > 
                        <span slot="annotation">Customize bad links</span>
                    </TableOfContentsRow>
                {/if}
            </tbody>
        </table>
    </div>

    <Acknowledgements />
    <License />

    <h2 class="bookish-header" id="print">Print</h2>

    <Instructions>
        This offers a way for readers to print the entire book as a single page.
    </Instructions>

    <p>
        Want to print this book or generate a PDF? 
        See <Link to={base + "print"}>all chapters on a single page</Link> and then print or export.
        Long books can take some time to render.
    </p>

    <h2 class="bookish-header" id="citation">Citation</h2>

    <Instructions>
        This citation is dynamically created from the current authors, title, and date.
    </Instructions>

    <!-- Book citation -->
    <p>
        { $edition.getAuthors().map(author => Parser.parseFormat($edition, author).toText()).join(", ") } ({(new Date()).getFullYear() }). <em>{$edition.getTitle()}</em>. { location.protocol+'//'+location.host+location.pathname }, <em>retrieved { (new Date()).toLocaleDateString("en-US")}</em>.
    </p>

    <Revisions />
    
</Page>