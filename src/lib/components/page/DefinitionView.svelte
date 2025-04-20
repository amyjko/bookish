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
        isEditionEditable,
    } from './Contexts';
    import Button from '../app/Button.svelte';

    export let id: string;
    export let definition: Definition;

    let auth = getUser();
    let edition = getEdition();
    let editable = isEditionEditable();

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
                }),
            );
        }
        newSynonym = true;
    }

    function removeSynonym(index: number) {
        if (
            definition.synonyms &&
            index >= 0 &&
            index < definition.synonyms.length
        )
            updateSynonyms([
                ...definition.synonyms.slice(0, index),
                ...definition.synonyms.slice(index + 1),
            ]);
    }

    function updateSynonyms(synonyms: string[]) {
        if ($edition)
            edition.set(
                $edition.withEditedDefinition(id, {
                    phrase: definition.phrase,
                    definition: definition.definition,
                    synonyms: synonyms,
                }),
            );
    }

    $: syns = definition.synonyms || [];
</script>

{#if $edition}
    <section class="definition">
        <dt>
            {#if editable}
                <TextEditor
                    text={definition.phrase}
                    saveOnExit
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
                                      synonyms: definition.synonyms ?? [],
                                  }),
                              )
                            : undefined}
                />
            {:else if definition.phrase}{definition.phrase}{:else}<em
                    >&mdash;</em
                >{/if}
            {#if editable}
                <ConfirmButton
                    tooltip="delete definition of {definition.phrase}"
                    confirm="delete entry"
                    command={() =>
                        $edition
                            ? edition.set($edition.withoutDefinition(id))
                            : undefined}>⨉</ConfirmButton
                >
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
                                      synonyms: definition.synonyms ?? [],
                                  }),
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
                        definition.definition,
                    ).withTextIfEmpty()}
                />
            {/if}
            {#if edition && editable}
                <span bind:this={synonymsEditor}>
                    {#each syns as syn, index}
                        <Note>
                            <TextEditor
                                text={syn}
                                label={'Synonym editor.'}
                                placeholder="synonym"
                                valid={() => undefined}
                                save={(text) => {
                                    const newSyns = [...syns];
                                    newSyns[index] = text;
                                    updateSynonyms(newSyns);
                                }}
                            />
                            <Button
                                tooltip="delete synonym"
                                command={() => removeSynonym(index)}>x</Button
                            >
                        </Note>
                        {#if syns.length > 1 && index < syns.length - 1},&nbsp;{/if}
                    {/each}
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
        margin-bottom: var(--bookish-paragraph-spacing);
    }

    dt {
        font-family: var(--bookish-header-font-family);
        font-weight: bold;
        vertical-align: baseline;
    }
</style>
