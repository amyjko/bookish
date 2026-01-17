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

    let publisher = false;

    $: {
        if ($user && $user.user) updateUserClaims();
    }

    async function updateUserClaims() {
        if ($user === undefined || $user.user === null) return;
        const token = await $user.user.getIdTokenResult();
        publisher =
            'publisher' in token.claims && token.claims.publisher === true;
    }

    async function handleDraftEdition() {
        if ($book === undefined) return;

        try {
            const revisedBook = await createNewEdition($book);
            book.set(revisedBook);
        } catch (err) {
            console.error('Error creating new edition:', err);
        }
    }
</script>

{#if $book && editions}
    {#if editable}
        <p>
            <Button
                tooltip="create new edition"
                command={handleDraftEdition}
                disabled={!publisher}>+ edition</Button
            >
        </p>
        {#if !publisher}
            <Note
                >You must have publisher privileges to create new editions. If
                you believe this is an error, please contact support.</Note
            >
        {/if}
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
        {@const editionNumber = edition.number}
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
                                edition.published,
                            ).toLocaleDateString(
                                'en-us',
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
                {#if edition.summary !== ''}<p
                        ><em
                            ><Format
                                node={Parser.parseFormat(
                                    undefined,
                                    edition.summary,
                                )}
                            /></em
                        ></p
                    >{/if}
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
