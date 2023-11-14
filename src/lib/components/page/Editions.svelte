<script lang="ts">
    import { createNewEdition } from '$lib/models/CRUD';
    import Instructions from '$lib/components/page/Instructions.svelte';
    import Note from '../editor/Note.svelte';
    import { getBook, getUser, isBookEditable } from './Contexts';
    import Button from '../app/Button.svelte';
    import Link from '../app/Link.svelte';
    import Format from '../chapter/Format.svelte';
    import Parser from '../../models/chapter/Parser';
    import Permissions from '../editor/Permissions.svelte';

    export let editors: boolean = true;

    let book = getBook();
    let editable = isBookEditable();
    let user = getUser();

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
    {#each editions as edition, index (edition.ref)}
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

        {#if $book && (editable || edition.published || ($user?.user?.uid && edition.editionuids.includes($user.user.uid)))}
            <section class="edition">
                <h3
                    >{editionLabel}
                    <Note
                        >{#if edition.published}{new Date(
                                edition.published
                            ).toLocaleDateString(
                                'en-us'
                            )}{:else}unpublished{/if}
                        {#if edition.published}&nbsp;
                            <Link
                                to={latestPublishedID === edition.ref.id &&
                                $book.getSubdomain() !== undefined
                                    ? `/${$book.getSubdomain()}`
                                    : `/${$book.getID()}/${
                                          editions.length - index
                                      }`}
                                external>read</Link
                            >{/if}
                        {#if editable || ($user?.user?.uid && edition.editionuids.includes($user?.user.uid))}
                            &nbsp;
                            <Link
                                to={`/write/${$book.getID()}/${
                                    editions.length - index
                                }`}>edit</Link
                            >
                        {/if}
                    </Note>
                </h3>
                <p
                    >{#if edition.summary !== ''}<Format
                            node={Parser.parseFormat(
                                undefined,
                                edition.summary
                            )}
                        />{:else}&mdash;{/if}</p
                >
            </section>
        {/if}
    {/each}

    {#if editable && editors}
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
