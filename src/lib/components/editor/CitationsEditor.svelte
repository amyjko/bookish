<script lang="ts">
    import type CitationsNode from "$lib/models/chapter/CitationsNode";
    import { getCaret, getEdition } from "../page/Contexts";
    import Note from "./Note.svelte";
    import Options from "../app/Options.svelte";
    import Button from "../app/Button.svelte";

    export let citations: CitationsNode;

    let edition = getEdition();
    let caret = getCaret();
    let value = "";

    function handleSelection(selection: string) {
        if(selection.length > 0)
            update(new Set([ ...citations.getMeta(), selection ]));
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
    let options: [string, string][] = [];
    $: {
        options = [];
        options.push([ uncited.length > 0 ? "Choose references" : "No uncited references", "" ]);
        for(const citationID of uncited)
            options.push([ citationID, citationID ]);
    }
</script>

<Options options={options} bind:value={value} changed={handleSelection} />
{#each citations.getMeta() as citationID}
    {citationID}
    <Button tooltip="Remove citation" command={() => removeSelection(citationID) }>&times;</Button>
{:else}
    <Note>&mdash;</Note>
{/each}