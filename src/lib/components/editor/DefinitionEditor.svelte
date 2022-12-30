<script lang="ts">
    import type DefinitionNode from '$lib/models/chapter/DefinitionNode';
    import { getCaret, getEdition } from '../page/Contexts';
    import Options from '../app/Options.svelte';
    import Note from './Note.svelte';

    export let definition: DefinitionNode;

    let edition = getEdition();
    let caret = getCaret();

    $: glossary = $edition.getGlossary();

    function handleChange(glossaryID: string) {
        $caret?.edit(definition, definition.withMeta(glossaryID));
    }

    // Sort the glossary entries by phrase
    $: entries = Object.keys(glossary)
        .map((key) => {
            return { glossaryID: key, phrase: glossary[key].phrase };
        })
        .sort((a, b) => a.phrase.localeCompare(b.phrase));
</script>

{#if entries.length === 0}
    <Note>No glossary entries to add</Note>
{:else}
    <Options
        options={entries.map((entry) => [entry.phrase, entry.glossaryID])}
        value={definition.getMeta()}
        changed={handleChange}
    />
    {#if !(definition.getMeta() in glossary)}
        <Note>Choose a glossary entry.</Note>
    {/if}
{/if}
