<script lang="ts">
    import Parser from '$lib/models/chapter/Parser';
    import type Definition from '$lib/models/book/Definition';
    import ConfirmButton from '../editor/ConfirmButton.svelte';
    import TextEditor from '$lib/components/editor/TextEditor.svelte';
    import BookishEditor from '$lib/components/editor/BookishEditor.svelte';
    import Format from '$lib/components/chapter/Format.svelte';
    import Note from '../editor/Note.svelte';
    import { afterUpdate } from 'svelte';
    import { getEdition, isEditable } from './Contexts';
    import Button from '../app/Button.svelte';

    export let id: string;
    export let definition: Definition;

    let edition = getEdition();
    let editable = isEditable();

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

    $: format = Parser.parseFormat(
        undefined,
        definition.definition
    ).withTextIfEmpty();

    function addSynonym() {
        if ($edition && definition.synonyms) {
            $edition.editDefinition(id, {
                phrase: definition.phrase,
                definition: definition.definition,
                synonyms: [...definition.synonyms, ''],
            });
        }
        newSynonym = true;
    }

    $: syns = definition.synonyms || [];
</script>

<tr>
    <td>
        <strong>
            {#if editable}
                <TextEditor
                    text={definition.phrase}
                    label={'Glossary phrase editor.'}
                    placeholder="Phrase"
                    valid={(text) => {
                        if (text.length === 0) return "Phrase can't be empty";
                    }}
                    save={(text) =>
                        $edition.editDefinition(id, {
                            phrase: text,
                            definition: definition.definition,
                            synonyms: definition.synonyms,
                        })}
                />
            {:else if definition.phrase}{definition.phrase}{:else}<em>Phrase</em
                >{/if}
        </strong>
        {#if editable}
            <br /><ConfirmButton
                tooltip="Delete this glossary entry."
                commandLabel="x delete"
                confirmLabel="confirm"
                command={() => $edition.removeDefinition(id)}
            />
        {/if}
    </td>
    <td>
        {#if editable && edition}
            <BookishEditor
                ast={format}
                save={(node) =>
                    $edition.editDefinition(id, {
                        phrase: definition.phrase,
                        definition: node.toBookdown(),
                        synonyms: definition.synonyms,
                    })}
                chapter={false}
                component={Format}
                placeholder="How would you define this?"
            />
        {:else if definition.definition === ''}
            <em>Definition</em>
        {:else}
            <Format node={format} />
        {/if}
        <br />
        {#if edition && editable}
            <span bind:this={synonymsEditor}>
                {#if syns.length === 0}
                    <Note>No synonyms</Note>
                {:else}
                    {#each syns as syn, index}
                        <Note>
                            <TextEditor
                                text={syn}
                                label={'Synonym editor.'}
                                placeholder="Synonym"
                                valid={() => undefined}
                                save={(text) => {
                                    const newSyns = [...syns];
                                    // Remove the synonym if it's empty but wasn't before
                                    if (syn.length > 0 && text.length === 0)
                                        newSyns.splice(index, 1);
                                    else newSyns[index] = text;
                                    return $edition.editDefinition(id, {
                                        phrase: definition.phrase,
                                        definition: definition.definition,
                                        synonyms: newSyns,
                                    });
                                }}
                            />
                        </Note>
                        {#if syns.length > 1 && index < syns.length - 1},&nbsp;{/if}
                    {/each}
                {/if}
            </span>&nbsp;<Button
                tooltip="Add a synonym of this glossary entry"
                command={addSynonym}>+</Button
            >
        {:else if definition.synonyms !== undefined && definition.synonyms.length > 0}
            <Note>{definition.synonyms.join(', ')}</Note>
        {/if}
    </td>
</tr>

<style>
    td {
        vertical-align: top;
        font-family: var(--bookish-paragraph-font-family);
        font-size: var(--bookish-paragraph-font-size);
    }

    td:nth-child(1) {
        width: 10em;
        text-align: left;
    }

    td:nth-child(3) {
        width: 10em;
        text-align: right;
    }
</style>
