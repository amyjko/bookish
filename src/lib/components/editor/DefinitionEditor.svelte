<script lang="ts">
    import type DefinitionNode from "$lib/models/chapter/DefinitionNode";
    import type CaretContext from "$lib/components/editor/CaretContext";
    import { getContext } from "svelte";
    import { CARET, EDITION } from "../page/Symbols";
    import type Edition from "$lib/models/book/Edition";

    export let definition: DefinitionNode;

    let edition = getContext<Edition>(EDITION);
    let caret = getContext<CaretContext>(CARET);
 
    $: glossary = edition.getGlossary();

    function handleChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        caret?.edit(definition, definition.withMeta(target.value))
    }

    // Sort the glossary entries by phrase
    $: entries = Object.keys(glossary).map(key => { return { glossaryID: key, phrase: glossary[key].phrase }; }).sort((a, b) => a.phrase.localeCompare(b.phrase));    
    $: refID = edition.getRef()?.id;
    $: glossaryLink = `/write/${refID}/glossary`;

</script>

<span>
    <select 
        tabindex={0} 
        value={definition.getMeta()} 
        on:change={handleChange}
    >
        <option value=""></option>
        {#each entries as entry}<option value={entry.glossaryID}>{entry.phrase}</option>{/each}
    </select>
    {#if !(definition.getMeta() in glossary)}
        <span class="bookish-editor-error">Choose a <a href={glossaryLink}>glossary</a> entry.</span>
    {/if}
</span>