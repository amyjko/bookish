<script lang="ts">
    import Parser from '$lib/models/chapter/Parser';
    import { createNewEdition, publishEdition } from '$lib/models/CRUD';
    import Format from '$lib/components/chapter/Format.svelte';
    import BookishEditor from '$lib/components/editor/BookishEditor.svelte';
    import Switch from '$lib/components/editor/Switch.svelte';
    import Instructions from '$lib/components/page/Instructions.svelte';
    import Note from '../editor/Note.svelte';
    import { getBook, getEdition, isEditable } from './Contexts';
    import Button from '../app/Button.svelte';
    import Link from '../Link.svelte';
    import PageHeader from './PageHeader.svelte';
    import Rows from './Rows.svelte';

    let edition = getEdition();
    let editable = isEditable();
    let book = getBook();

    // Book revisions
    $: bookRevisions = $book?.getRevisions();

    // Copy the current draft to create a new draft.
    function handlePublish(index: number, published: boolean) {
        if ($book === undefined) return;
        book.set($book.asPublished(published, index));
    }

    async function handleDraftEdition() {
        if ($book === undefined) return;
        book.set(await createNewEdition($book));
    }
</script>

{#if $edition}
    {#if $book && bookRevisions}
        <PageHeader id="revisions"
            >Editions {#if editable}<Button
                    tooltip="Create a new edition"
                    command={handleDraftEdition}>+</Button
                >{/if}</PageHeader
        >
        <Instructions>
            Each book has one or more editions, allowing you to track revisions
            and ensure previous versions remain available. When you're ready to
            revise, make a new edition, then publish it when you're done. The
            edition with a * is the default edition readers will see, unless
            they explicitly choose to view a previous edition.
        </Instructions>
        <Rows>
            {#each bookRevisions as revision, index (revision.ref)}
                {@const editionNumber =
                    bookRevisions === undefined
                        ? -1
                        : bookRevisions.length - index}
                {@const editionLabel =
                    editionNumber +
                    (editionNumber === 1
                        ? 'st'
                        : editionNumber === 2
                        ? 'nd'
                        : editionNumber === 3
                        ? 'rd'
                        : 'th')}
                {@const viewing = revision.ref.id === $edition.getRef()?.id}

                {#if $book && (editable || revision.published)}
                    <tr>
                        <td>
                            {#if viewing}
                                <strong class="viewing">{editionLabel}</strong>
                            {:else}
                                <Link
                                    to={`/write/${$book.ref.id}/${
                                        bookRevisions.length - index
                                    }`}>{editionLabel}</Link
                                >
                            {/if}
                            <Note
                                >{new Date(revision.time).toLocaleDateString(
                                    'en-us'
                                )}</Note
                            >
                        </td>
                        <td>
                            {#if editable}
                                <BookishEditor
                                    ast={Parser.parseFormat(
                                        undefined,
                                        revision.summary
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
                            {:else if revision.summary === ''}
                                <em>No summary of changes</em>
                            {:else}
                                {revision.summary}
                            {/if}
                        </td>
                        <td style="whitespace: nowrap">
                            {#if editable}
                                <Switch
                                    options={['hidden', 'published']}
                                    enabled={revision.published ||
                                        revision.summary !== ''}
                                    value={revision.published
                                        ? 'published'
                                        : 'hidden'}
                                    edit={(published) =>
                                        handlePublish(
                                            index,
                                            published === 'published'
                                        )}
                                />
                            {/if}
                        </td>
                    </tr>
                {/if}
            {/each}
        </Rows>
    {/if}
{/if}

<style>
    .viewing {
        border-bottom: var(--app-chrome-border-size) solid
            var(--app-border-color);
    }

    td:first-child {
        width: 5%;
    }

    td:last-child {
        width: 30%;
    }
</style>