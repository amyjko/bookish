<script lang="ts">
    import type DefinitionNode from "$lib/models/chapter/DefinitionNode";
    import { getCaret, getEdition } from "../page/Contexts";
    import Muted from "../page/Muted.svelte";

    export let definition: DefinitionNode;

    let edition = getEdition();
    let caret = getCaret();
 
    $: glossary = $edition.getGlossary();

    function handleChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        $caret?.edit(definition, definition.withMeta(target.value))
    }

    // Sort the glossary entries by phrase
    $: entries = Object.keys(glossary).map(key => { return { glossaryID: key, phrase: glossary[key].phrase }; }).sort((a, b) => a.phrase.localeCompare(b.phrase));    
    $: refID = $edition.getRef()?.id;
    $: glossaryLink = `/write/${refID}/glossary`;

</script>

<span>
    <select 
        tabIndex=0
        value={definition.getMeta()} 
        on:change={handleChange}
    >
        <option value=""></option>
        {#each entries as entry}<option value={entry.glossaryID}>{entry.phrase}</option>{/each}
    </select>
    {#if !(definition.getMeta() in glossary)}
        <Muted>Choose a <a href={glossaryLink}>glossary</a> entry.</Muted>
    {/if}
</span>