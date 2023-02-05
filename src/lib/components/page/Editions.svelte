<script lang="ts">
    import { createNewEdition } from '$lib/models/CRUD';
    import Instructions from '$lib/components/page/Instructions.svelte';
    import Note from '../editor/Note.svelte';
    import { getUser, getBook, isBookEditable } from './Contexts';
    import Button from '../app/Button.svelte';
    import Link from '../app/Link.svelte';
    import Format from '../chapter/Format.svelte';
    import Parser from '../../models/chapter/Parser';
    import Permissions from '../editor/Permissions.svelte';

    let book = getBook();
    let editable = isBookEditable();

    $: editions = $book?.getEditions();

    $: latestPublishedID = $book?.getLatestPublishedEditionID();

    async function handleDraftEdition() {
        if ($book === undefined) return;
        book.set(await createNewEdition($book));
    }
</script>

{#if $book && editions}
    {#if editable}
        <p>
            <Button tooltip="create new edition" command={handleDraftEdition}
                >+ edition</Button
            >
        </p>
    {/if}
    <Instructions {editable}>
        Each book has one or more editions, allowing you to track revisions and
        ensure previous versions remain available. When you're ready to revise,
        add a new edition here; it will copy the latest edition, which you can
        then edit. When you're ready to publish an edition, write a summary here
        and then publish. By default, readers will see the latest published
        edition, but they can access older editions here.
    </Instructions>
    {#each editions as bookEdition, index (bookEdition.ref)}
        {@const editionNumber =
            editions === undefined ? -1 : editions.length - index}
        {@const editionLabel =
            editionNumber +
            (editionNumber === 1
                ? 'st'
                : editionNumber === 2
                ? 'nd'
                : editionNumber === 3
                ? 'rd'
                : 'th')}

        {#if $book && (editable || bookEdition.published)}
            <section class="edition">
                <h3
                    >{editionLabel}
                    <Note
                        >{#if bookEdition.published}{new Date(
                                bookEdition.published
                            ).toLocaleDateString(
                                'en-us'
                            )}{:else}unpublished{/if}
                        &nbsp;
                        <Link
                            to={latestPublishedID === bookEdition.ref.id &&
                            $book.getSubdomain() !== undefined
                                ? `/${$book.getSubdomain()}`
                                : `/${$book.ref.id}/${editions.length - index}`}
                            >read</Link
                        >
                        {#if editable}
                            &nbsp;
                            <Link
                                to={`/write/${$book.ref.id}/${
                                    editions.length - index
                                }`}>edit</Link
                            >
                        {/if}
                    </Note>
                </h3>
                <p
                    >{#if bookEdition.summary !== ''}<Format
                            node={Parser.parseFormat(
                                undefined,
                                bookEdition.summary
                            )}
                        />{:else}&mdash{/if}</p
                >
            </section>
        {/if}
    {/each}

    {#if editable}
        <h2>Editors</h2>
        <Instructions {editable}>
            These authors can edit any aspect of the book and any of its
            editions.
        </Instructions>

        <Permissions
            uids={$book.uids}
            inheriteduids={[]}
            atleastone={true}
            writable={editable}
            change={(uids) =>
                $book ? book.set($book.withEditors(uids)) : undefined}
        />
    {/if}
{/if}
