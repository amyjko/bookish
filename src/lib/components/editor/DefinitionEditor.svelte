<script lang="ts">
    import type DefinitionNode from '$lib/models/chapter/DefinitionNode';
    import Options from '../app/Options.svelte';
    import Note from './Note.svelte';
    import { getCaret, getEdition } from '$lib/components/page/Contexts';

    export let definition: DefinitionNode;

    let caret = getCaret();
    let edition = getEdition();
    $: glossary = $edition?.getGlossary();

    function handleChange(glossaryID: string) {
        $caret?.edit(definition, definition.withMeta(glossaryID));
    }

    // Sort the glossary entries by phrase
    $: entries =
        glossary === undefined
            ? undefined
            : Object.entries(glossary)
                  .map(([key, value]) => {
                      return { glossaryID: key, phrase: value.phrase };
                  })
                  .sort((a, b) =>
                      a && b ? a.phrase.localeCompare(b.phrase) : 0
                  );
</script>

{#if entries !== undefined && glossary !== undefined}
    {#if entries.length === 0}
        <Note>No glossary entries to add</Note>
    {:else}
        <Options
            options={entries.map((entry) => [entry.phrase, entry.glossaryID])}
            value={definition.getMeta()}
            changed={handleChange}
            label="choose definition"
        />
        {#if !(definition.getMeta() in glossary)}
            <Note>Choose a glossary entry.</Note>
        {/if}
    {/if}
{/if}
