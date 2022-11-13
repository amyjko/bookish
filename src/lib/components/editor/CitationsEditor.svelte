<script lang="ts">
    import type CitationsNode from "$lib/models/chapter/CitationsNode";
    import { getCaret, getEdition } from "../page/Contexts";
    import Note from "./Note.svelte";

    export let citations: CitationsNode;

    let edition = getEdition();
    let caret = getCaret();
    let selection: string | undefined;

    function handleSelection() {
        if(selection) {
            update(new Set([ ...citations.getMeta(), selection ]));
            selection = undefined;
        }
    }

    function removeSelection(citationID: string) {
        let ids = new Set(citations.getMeta());
        ids.delete(citationID);
        update(ids);
    }

    function update(set: Set<string>) {
        $caret?.edit(citations, citations.withMeta(Array.from(set)));
    }

    $: uncited = Object.keys($edition.getReferences()).filter(citationID => !citations.getMeta().includes(citationID)).sort();
</script>

<select bind:value={selection} on:change={handleSelection}>
    <option value={undefined}><em>{uncited.length > 0 ? "Choose references" : "No uncited references"}</em></option>
    {#each uncited as citationID}
        <option value={citationID}>{citationID}</option>
    {/each}

</select>
{#each citations.getMeta() as citationID}
    <sup>
        {citationID}
        <span tabIndex=0
            style="cursor:pointer"
            on:click={() => removeSelection(citationID) }
            on:keydown={ event => { if(event.key === "Enter" || event.key === " ") removeSelection(citationID); }}
        >&times;</span>
    </sup>
{:else}
    <Note>&mdash;</Note>
{/each}