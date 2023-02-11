<script lang="ts">
    import Parser from '../../models/chapter/Parser';
    import BookishEditor from '../editor/BookishEditor.svelte';
    import Switch from '../editor/Switch.svelte';
    import {
        getUser,
        getEdition,
        getLeasee,
        isEditionEditable,
        lease,
    } from './Contexts';
    import Format from '../chapter/Format.svelte';
    import Note from '../editor/Note.svelte';
    import Instructions from './Instructions.svelte';
    import Link from '../Link.svelte';
    import { PUBLIC_CONTEXT } from '$env/static/public';
    import Button from '../app/Button.svelte';
    import { publish } from '../../models/CRUD';
    import Feedback from '../app/Feedback.svelte';

    let auth = getUser();
    let edition = getEdition();
    let editable = isEditionEditable();

    let publishing = false;
    let feedback: string | undefined = undefined;
    let error: string | undefined = undefined;
    let url: string | undefined = undefined;
    async function requestPublish() {
        if ($edition) {
            publishing = true;
            error = undefined;
            feedback = 'Binding the book, this could take a minute...';
            try {
                const result = await publish($edition);
                if (typeof result === 'string') {
                    error = result;
                    feedback = undefined;
                } else {
                    url = result.url;
                }
            } catch (err) {
                console.log(err);
                feedback = undefined;
                error = 'Unable to bundle the book for download :(';
            } finally {
                publishing = false;
            }
        }
    }

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

{#if $edition && (publisher === true || PUBLIC_CONTEXT === 'local')}
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
        <!-- Disabled until we can find a way to properly build the book in a cloud function. -->
        <!-- <Button
            tooltip="Publish the book online"
            disabled={publishing}
            command={() => requestPublish()}>↓ download</Button
        > -->
    </div>
    {#if error}
        <Feedback error>{error}</Feedback>
    {:else if url}
        <p>Your book is <Link to={url}>ready for download</Link>.</p>
    {:else if feedback}
        <Feedback>{feedback}</Feedback>
    {/if}
    <div>
        <Note
            >{#if $edition.published}Last published {new Date(
                    $edition.published
                ).toLocaleDateString('en-us')}{/if}</Note
        >
    </div>
{:else}
    <Instructions {editable}>
        You don't yet have publishing privileges. <Link
            to="mailto:amy@amyjko.com">Write Amy</Link
        > to schedule a chat about your book and ask for publishing privileges.
    </Instructions>
{/if}

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
