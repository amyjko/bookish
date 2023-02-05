<script lang="ts">
    import Parser from '$lib/models/chapter/Parser';
    import type Definition from '$lib/models/book/Definition';
    import ConfirmButton from '../editor/ConfirmButton.svelte';
    import TextEditor from '$lib/components/editor/TextEditor.svelte';
    import BookishEditor from '$lib/components/editor/BookishEditor.svelte';
    import Format from '$lib/components/chapter/Format.svelte';
    import Note from '../editor/Note.svelte';
    import { afterUpdate } from 'svelte';
    import {
        getUser,
        getEdition,
        getLeasee,
        isChapterEditable,
        lease,
    } from './Contexts';
    import Button from '../app/Button.svelte';

    export let id: string;
    export let definition: Definition;

    let auth = getUser();
    let edition = getEdition();
    let editable = isChapterEditable();

    // Focus after adding a new synonym.
    let newSynonym = false;
    let synonymsEditor: HTMLSpanElement | null = null;

    afterUpdate(() => {
        if (newSynonym && synonymsEditor) {
            const editors = synonymsEditor.querySelectorAll('input');
            if (editors.length > 0) {
                const last = editors[editors.length - 1];
                if (last instanceof HTMLElement) last.focus();
            }
            newSynonym = false;
        }
    });

    function addSynonym() {
        if ($edition) {
            edition.set(
                $edition.withEditedDefinition(id, {
                    phrase: definition.phrase,
                    definition: definition.definition,
                    synonyms: [...(definition.synonyms ?? []), ''],
                })
            );
        }
        newSynonym = true;
    }

    $: syns = definition.synonyms || [];
</script>

{#if $edition}
    <section class="definition">
        <dt>
            {#if editable}
                <TextEditor
                    text={definition.phrase}
                    label={'Glossary phrase editor.'}
                    placeholder="phrase"
                    valid={(text) => {
                        if (text.length === 0) return "phrase can't be empty";
                    }}
                    save={(text) =>
                        $edition
                            ? edition.set(
                                  $edition.withEditedDefinition(id, {
                                      phrase: text,
                                      definition: definition.definition,
                                      synonyms: definition.synonyms,
                                  })
                              )
                            : undefined}
                />
            {:else if definition.phrase}{definition.phrase}{:else}<em
                    >&mdash;</em
                >{/if}
            {#if editable}
                <ConfirmButton
                    tooltip="delete entry {definition.phrase}"
                    commandLabel="- definition"
                    confirmLabel="confirm"
                    command={() =>
                        $edition
                            ? edition.set($edition.withoutDefinition(id))
                            : undefined}
                />
            {/if}
        </dt>

        <dd class="term">
            {#if editable && edition}
                <BookishEditor
                    text={definition.definition}
                    parser={(text) =>
                        Parser.parseFormat(undefined, text).withTextIfEmpty()}
                    save={(node) =>
                        $edition
                            ? edition.set(
                                  $edition.withEditedDefinition(id, {
                                      phrase: definition.phrase,
                                      definition: node.toBookdown(),
                                      synonyms: definition.synonyms,
                                  })
                              )
                            : undefined}
                    chapter={false}
                    component={Format}
                    placeholder="definition"
                    leasee={getLeasee(auth, edition, `definition-${id}`)}
                    lease={(lock) =>
                        lease(auth, edition, `definition-${id}`, lock)}
                />
            {:else if definition.definition === ''}
                <em>Definition</em>
            {:else}
                <Format
                    node={Parser.parseFormat(
                        undefined,
                        definition.definition
                    ).withTextIfEmpty()}
                />
            {/if}
            {#if edition && editable}
                <span bind:this={synonymsEditor}>
                    {#if syns.length === 0}
                        <Note>no synonyms</Note>
                    {:else}
                        {#each syns as syn, index}
                            <Note>
                                <TextEditor
                                    text={syn}
                                    label={'Synonym editor.'}
                                    placeholder="synonym"
                                    valid={() => undefined}
                                    save={(text) => {
                                        const newSyns = [...syns];
                                        // Remove the synonym if it's empty but wasn't before
                                        if (syn.length > 0 && text.length === 0)
                                            newSyns.splice(index, 1);
                                        else newSyns[index] = text;
                                        if ($edition)
                                            edition.set(
                                                $edition.withEditedDefinition(
                                                    id,
                                                    {
                                                        phrase: definition.phrase,
                                                        definition:
                                                            definition.definition,
                                                        synonyms: newSyns,
                                                    }
                                                )
                                            );
                                    }}
                                />
                            </Note>
                            {#if syns.length > 1 && index < syns.length - 1},&nbsp;{/if}
                        {/each}
                    {/if}
                </span>&nbsp;<Button tooltip="add synonym" command={addSynonym}
                    >+ synonym</Button
                >
            {:else if definition.synonyms !== undefined && definition.synonyms.length > 0}
                <Note>{definition.synonyms.join(', ')}</Note>
            {/if}
        </dd>
    </section>
{/if}

<style>
    dd {
        margin: 0;
        margin-top: var(--bookish-paragraph-spacing);
    }

    dt {
        font-weight: bold;
    }
</style>
