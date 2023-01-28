<script lang="ts">
    import Parser from '../../models/chapter/Parser';
    import BookishEditor from '../editor/BookishEditor.svelte';
    import Switch from '../editor/Switch.svelte';
    import {
        getAuth,
        getEdition,
        getLeasee,
        isEditionEditable,
        lease,
    } from './Contexts';
    import Format from '../chapter/Format.svelte';
    import Note from '../editor/Note.svelte';
    import Instructions from './Instructions.svelte';
    import Link from '../Link.svelte';

    let auth = getAuth();
    let edition = getEdition();
    let editable = isEditionEditable();

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

    let publisher: boolean | undefined = undefined;

    $: {
        if ($auth && $auth.user) updateUserClaims();
    }

    async function updateUserClaims() {
        if ($auth === undefined || $auth.user === null) return;
        const token = await $auth.user.getIdTokenResult();
        publisher =
            'publisher' in token.claims && token.claims.publisher === true;
    }
</script>

{#if $edition && publisher === true}
    <Instructions {editable}>
        Ready to publish this edition? Write a summary then hit the switch.
    </Instructions>

    <div class="publisher">
        <div class="summary">
            <BookishEditor
                text={$edition.summary}
                parser={(text) =>
                    Parser.parseFormat(undefined, text).withTextIfEmpty()}
                save={(newSummary) =>
                    $edition
                        ? edition.set(
                              $edition.withSummary(newSummary.toBookdown())
                          )
                        : undefined}
                chapter={false}
                component={Format}
                placeholder="Summarize this edition's changes to publish."
                leasee={getLeasee(auth, edition, 'summary')}
                lease={(lock) => lease(auth, edition, 'summary', lock)}
            />
        </div>
        <Switch
            options={['hidden', 'published']}
            enabled={$edition.published !== null || $edition.summary.length > 0}
            value={$edition.published !== null ? 'published' : 'hidden'}
            edit={(published) =>
                $edition
                    ? edition.set(
                          $edition.asPublished(published === 'published')
                      )
                    : undefined}
        />
    </div>
    <Note
        >{#if $edition.published}Last published {new Date(
                $edition.published
            ).toLocaleDateString('en-us')}{/if}</Note
    >
{:else}
    <Instructions {editable}>
        You don't yet have publishing privileges. <Link
            to="mailto:amy@amyjko.com">Write Amy</Link
        > to schedule a chat about your book and ask for publishing privileges.
    </Instructions>
{/if}

<!-- TODO Disabled for now.  See functions/index.ts/publishEdition() for why. -->

<!-- <Button
    tooltip="publish edition"
    command={() => handlePublish(index)}
    disabled={publishing.has(index)}
    >publish</Button
-->
<style>
    .publisher {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        width: 100%;
        align-items: baseline;
    }

    .summary {
        flex: 1;
    }
</style>
