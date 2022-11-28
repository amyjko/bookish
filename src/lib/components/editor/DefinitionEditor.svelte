<script lang="ts">
    import type DefinitionNode from "$lib/models/chapter/DefinitionNode";
    import { getCaret, getEdition } from "../page/Contexts";
    import Muted from "../page/Muted.svelte";
    import Options from "../app/Options.svelte";

    export let definition: DefinitionNode;

    let edition = getEdition();
    let caret = getCaret();
 
    $: glossary = $edition.getGlossary();

    function handleChange(glossaryID: string) {
        $caret?.edit(definition, definition.withMeta(glossaryID));
    }

    // Sort the glossary entries by phrase
    $: entries = Object.keys(glossary).map(key => { return { glossaryID: key, phrase: glossary[key].phrase }; }).sort((a, b) => a.phrase.localeCompare(b.phrase));    

</script>

<Options 
    options={entries.map(entry => [ entry.phrase, entry.glossaryID ])}
    value={definition.getMeta()} 
    changed={handleChange}
/>
{#if !(definition.getMeta() in glossary)}
    <Muted>Choose a glossary entry.</Muted>
{/if}