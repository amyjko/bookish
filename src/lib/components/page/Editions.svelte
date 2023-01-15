<script lang="ts">
    import Parser from '$lib/models/chapter/Parser';
    import { createNewEdition, publish } from '$lib/models/CRUD';
    import Format from '$lib/components/chapter/Format.svelte';
    import BookishEditor from '$lib/components/editor/BookishEditor.svelte';
    import Instructions from '$lib/components/page/Instructions.svelte';
    import Note from '../editor/Note.svelte';
    import { getBook, getEdition, isEditable } from './Contexts';
    import Button from '../app/Button.svelte';
    import Link from '../Link.svelte';
    import PageHeader from './PageHeader.svelte';
    import Rows from './Rows.svelte';
    import Switch from '../editor/Switch.svelte';

    let edition = getEdition();
    let editable = isEditable();
    let book = getBook();

    // Book revisions
    $: bookEditions = $book?.getEditions();

    $: latestPublishedID = $book?.getLatestPublishedEditionID();

    async function handleDraftEdition() {
        if ($book === undefined) return;
        book.set(await createNewEdition($book));
    }

    // TODO Disabled for now. See functions/index.ts/publishEdition() for why.
    // let publishing = new Map<number, boolean | string>();
    // async function handlePublish(index: number) {
    //     if ($book) {
    //         publishing.set(index, true);
    //         const error = await publish($book, index);
    //         if (error) publishing.set(index, error);
    //         else publishing.delete(index);
    //         publishing = new Map(publishing);
    //     }
    // }

    function handlePublish(index: number, published: boolean) {
        if ($book === undefined) return;
        book.set($book.withEditionAsPublished(published, index));
    }
</script>

{#if $edition}
    {#if $book && bookEditions}
        <PageHeader id="revisions"
            >Editions {#if editable}<Button
                    tooltip="Create a new edition"
                    command={handleDraftEdition}>+</Button
                >{/if}</PageHeader
        >
        <Instructions>
            Each book has one or more editions, allowing you to track revisions
            and ensure previous versions remain available. When you're ready to
            revise, make a new edition, make your revisions, write a summary,
            and then publish. By default, readers will see the latest published
            edition, but they will be able to access older editions here.
        </Instructions>
        {#each bookEditions as bookEdition, index (bookEdition.ref)}
            {@const editionNumber =
                bookEditions === undefined ? -1 : bookEditions.length - index}
            {@const editionLabel =
                editionNumber +
                (editionNumber === 1
                    ? 'st'
                    : editionNumber === 2
                    ? 'nd'
                    : editionNumber === 3
                    ? 'rd'
                    : 'th')}
            {@const viewing = bookEdition.ref.id === $edition.getRef()?.id}

            {#if $book && (editable || bookEdition.published)}
                <section class="edition">
                    <h3
                        >{editionLabel}
                        <Note
                            >{new Date(bookEdition.time).toLocaleDateString(
                                'en-us'
                            )}
                            &nbsp;
                            <Link
                                to={latestPublishedID === bookEdition.ref.id
                                    ? `/${$book.getSubdomain()}`
                                    : `/${$book.ref.id}/${
                                          bookEditions.length - index
                                      }`}>view</Link
                            >
                            {#if editable}
                                &nbsp;
                                {#if viewing}
                                    viewing
                                {:else}
                                    <Link
                                        to={`/write/${$book.ref.id}/${
                                            bookEditions.length - index
                                        }`}>edit</Link
                                    >
                                {/if}
                            {/if}
                        </Note></h3
                    >
                    {#if editable}
                        <div class="controls">
                            <BookishEditor
                                ast={Parser.parseFormat(
                                    undefined,
                                    bookEdition.summary
                                ).withTextIfEmpty()}
                                save={(newSummary) =>
                                    $book
                                        ? book.set(
                                              $book.withEditionSummary(
                                                  newSummary.toBookdown(),
                                                  index
                                              )
                                          )
                                        : undefined}
                                chapter={false}
                                component={Format}
                                placeholder="Summarize this edition's changes."
                            />
                            <Switch
                                options={['hidden', 'published']}
                                enabled={bookEdition.published ||
                                    bookEdition.summary !== ''}
                                value={bookEdition.published
                                    ? 'published'
                                    : 'hidden'}
                                edit={(published) =>
                                    handlePublish(
                                        index,
                                        published === 'published'
                                    )}
                            />
                            <!-- TODO Disabled for now.  See functions/index.ts/publishEdition() for why. -->
                            <!-- <Button
                            tooltip="publish edition"
                            command={() => handlePublish(index)}
                            disabled={publishing.has(index)}
                            >publish</Button
                        >
                        {#if typeof publishing.get(index) === 'string'}
                            {publishing.get(index)}
                        {/if} -->
                        </div>
                    {:else if bookEdition.summary !== ''}
                        <p>{bookEdition.summary}</p>
                    {/if}
                </section>
            {/if}
        {/each}
    {/if}
{/if}

<style>
    .controls {
        display: flex;
        flex-wrap: nowrap;
        flex-direction: row;
        align-items: baseline;
        gap: var(--app-chrome-padding);
    }

    .controls :global(> :first-child) {
        flex: 1;
    }
</style>
