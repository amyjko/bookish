<script lang="ts">
    import Instructions from '$lib/components/page/Instructions.svelte';
    import Parser from '$lib/models/chapter/Parser';
    import TableOfContentsRow from './TableOfContentsRow.svelte';
    import ChapterIDs from '$lib/models/book/ChapterID';
    import Page from '$lib/components/page/Page.svelte';
    import Header from '$lib/components/page/Header.svelte';
    import Outline from '$lib/components/page/Outline.svelte';
    import Link from '$lib/components/Link.svelte';
    import SubdomainEditor from '$lib/components/page/SubdomainEditor.svelte';
    import Description from './Description.svelte';
    import Acknowledgements from './Acknowledgements.svelte';
    import License from '$lib/components/page/License.svelte';
    import Revisions from './Editions.svelte';
    import Authors from '$lib/components/page/Authors.svelte';
    import TextEditor from '$lib/components/editor/TextEditor.svelte';
    import Toggle from '$lib/components/editor/Toggle.svelte';
    import {
        getBase,
        getBook,
        getEdition,
        isEditable,
        setChapter,
    } from './Contexts';
    import Muted from './Muted.svelte';
    import Button from '../app/Button.svelte';
    import PageHeader from './PageHeader.svelte';
    import Rows from './Rows.svelte';
    import PageParagraph from './PageParagraph.svelte';
    import Note from '../editor/Note.svelte';

    let book = getBook();
    let edition = getEdition();
    let base = getBase();
    let editable = isEditable();

    function getProgressDescription(progress: null | number) {
        if (progress === null) return '';
        else if (progress === 0) return '';
        else if (progress < 30) return '; just started';
        else if (progress < 70) return '; halfway';
        else if (progress < 95) return '; almost done';
        else return '; done';
    }

    // Get the chapter progress
    let progressStorage =
        typeof localStorage !== 'undefined'
            ? localStorage.getItem('chapterProgress')
            : null;
    let progress = progressStorage === null ? {} : JSON.parse(progressStorage);

    // Is there a colon? Let's make a subtitle
    $: title = $edition?.getTitle() ?? '';
    let subtitle: string | undefined = undefined;
    $: {
        let colon = title.indexOf(':');
        if (colon >= 0) {
            subtitle = title.substring(colon + 1).trim();
            title = title.substring(0, colon).trim();
        }
    }

    let waitingForChapter = false;

    function addChapter() {
        if ($edition) edition.set($edition.withNewChapter());
    }
</script>

{#if $edition && $book}
    <Page title={$edition.getTitle()}>
        <Header
            label="Book title"
            getImage={() => $edition?.getImage('cover') ?? null}
            setImage={(embed) =>
                $edition
                    ? edition.set($edition.withImage('cover', embed))
                    : undefined}
            header={title}
            {subtitle}
            tags={$edition.getTags()}
            save={(text) =>
                $edition ? edition.set($edition.withTitle(text)) : undefined}
        >
            <svelte:fragment slot="before">
                {#if editable}
                    <SubdomainEditor />
                {/if}
            </svelte:fragment>
            <Outline
                slot="outline"
                previous={null}
                next={$edition.getNextChapterID('')}
            />
            <div slot="after">
                <Authors
                    authors={$edition.getAuthors()}
                    add={() =>
                        $edition
                            ? edition.set($edition.withAuthor(''))
                            : undefined}
                    edit={(index, text) =>
                        $edition
                            ? edition.set($edition.withAuthorName(index, text))
                            : undefined}
                    remove={(index) =>
                        $edition
                            ? edition.set($edition.withoutAuthor(index))
                            : undefined}
                />
                {#if $book.getPublishedEditionCount() > 1}
                    <Note>{$edition.getEditionLabel($book)} edition</Note>
                {/if}
            </div>
        </Header>

        <Instructions>
            Above you can edit your book's authors, title, and cover image.
        </Instructions>

        <Description />

        <Instructions>
            This will appear on the <Link to={$base + 'read'}
                >book browsing</Link
            > page and in your table of contents. Write an informative description
            of what your book is about.
        </Instructions>

        <Instructions>
            Add, remove, and reorder chapters here. You can add optional book
            sections to each chapter, toggle chapters as numbered/unnumbered or
            published/forthcoming. Click the title to edit the chapter.
        </Instructions>

        <PageHeader id="chapters"
            >Chapters {#if editable}<Button
                    tooltip="add empty chapter"
                    disabled={waitingForChapter}
                    command={addChapter}>+ chapter</Button
                >{/if}</PageHeader
        >

        <Rows>
            {#each $edition.getChapters() as chapter}
                {@const chapterID = chapter.getID()}
                {@const readingTime = chapter.getReadingTime($edition)}
                {@const readingEstimate =
                    readingTime === undefined
                        ? 'Forthcoming'
                        : readingTime < 5
                        ? '<5 min read'
                        : readingTime < 60
                        ? '~' + Math.floor(readingTime / 5) * 5 + ' min read'
                        : '~' + Math.floor(readingTime / 60) + ' hour read'}
                {@const section = chapter.getSection()}
                {@const etc =
                    readingEstimate +
                    (!chapter.isForthcoming()
                        ? getProgressDescription(
                              chapterID in progress ? progress[chapterID] : null
                          )
                        : '')}

                <TableOfContentsRow
                    {chapter}
                    {chapterID}
                    number={$edition.getChapterNumber(chapterID)}
                    title={chapter.getTitle()}
                    forthcoming={chapter.isForthcoming()}
                >
                    <span slot="annotation">
                        {#if editable}
                            <TextEditor
                                label={'Chapter section editor'}
                                text={section ? section : ''}
                                placeholder="Section"
                                valid={() => undefined}
                                save={(text) =>
                                    setChapter(
                                        edition,
                                        chapter,
                                        chapter.withSection(text)
                                    )}
                            />
                        {:else if section}{section}{/if}
                    </span>
                    <span slot="etc">
                        <Muted>
                            {#if editable}
                                <Toggle
                                    on={chapter.isForthcoming()}
                                    save={(on) =>
                                        setChapter(
                                            edition,
                                            chapter,
                                            chapter.asForthcoming(on)
                                        )}
                                >
                                    {etc}
                                </Toggle>
                            {:else}
                                {etc}
                            {/if}
                        </Muted>
                    </span>
                </TableOfContentsRow>
            {/each}
            {#if $edition.hasReferences() || editable}
                <TableOfContentsRow
                    chapterID={ChapterIDs.ReferencesID}
                    title="References"
                >
                    <span slot="annotation">Everything cited</span>
                </TableOfContentsRow>
            {/if}
            {#if ($edition.getGlossary() && Object.keys($edition.getGlossary()).length > 0) || editable}
                <TableOfContentsRow
                    chapterID={ChapterIDs.GlossaryID}
                    title="Glossary"
                >
                    <span slot="annotation">Definitions</span>
                </TableOfContentsRow>
            {/if}
            <TableOfContentsRow chapterID={ChapterIDs.IndexID} title="Index">
                <span slot="annotation">Common words and where they are</span>
            </TableOfContentsRow>
            <TableOfContentsRow chapterID={ChapterIDs.SearchID} title="Search">
                <span slot="annotation">Find where words occur</span>
            </TableOfContentsRow>

            <TableOfContentsRow chapterID={ChapterIDs.MediaID} title="Media">
                <span slot="annotation">Images and video in the book</span>
            </TableOfContentsRow>
            {#if editable}
                <TableOfContentsRow chapterID="theme" title="Theme">
                    <span slot="annotation">Style the book</span>
                </TableOfContentsRow>
                <TableOfContentsRow chapterID="unknown" title="Unknown">
                    <span slot="annotation">Customize bad links</span>
                </TableOfContentsRow>
            {/if}
        </Rows>

        <Acknowledgements />
        <License />

        <PageHeader id="print">Print</PageHeader>

        <Instructions>
            This offers a way for readers to print the entire book as a single
            page.
        </Instructions>

        <PageParagraph>
            Want to print this book or generate a PDF? See <Link
                to={$base + 'print'}>all chapters on a single page</Link
            > and then print or export. Long books can take some time to render.
        </PageParagraph>

        <PageHeader id="citation">Citation</PageHeader>

        <Instructions>
            This citation is dynamically created from the current authors,
            title, and date.
        </Instructions>

        <!-- Book citation -->
        <PageParagraph>
            {$edition
                .getAuthors()
                .map((author) => Parser.parseFormat($edition, author).toText())
                .join(', ')} ({new Date().getFullYear()}).
            <em>{$edition.getTitle()}</em>. {location.protocol +
                '//' +
                location.host +
                location.pathname},
            <em>retrieved {new Date().toLocaleDateString('en-US')}</em>.
        </PageParagraph>

        <Revisions />
    </Page>
{/if}
