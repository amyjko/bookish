<script lang="ts">
    import type CitationsNode from '$lib/models/chapter/CitationsNode';
    import Note from './Note.svelte';
    import Options from '../app/Options.svelte';
    import Button from '../app/Button.svelte';
    import { getCaret, getEdition } from '$lib/components/page/Contexts';

    interface Props {
        citations: CitationsNode;
    }

    let { citations }: Props = $props();

    let caret = getCaret();
    let edition = getEdition();

    let value = $state('');

    function handleSelection(selection: string) {
        if (selection.length > 0)
            update(new Set([...citations.getMeta(), selection]));
    }

    function removeSelection(citationID: string) {
        let ids = new Set(citations.getMeta());
        ids.delete(citationID);
        update(ids);
    }

    function update(set: Set<string>) {
        $caret?.edit(citations, citations.withMeta(Array.from(set)));
    }

    let uncited =
        $derived($edition === undefined
            ? []
            : Object.keys($edition.getReferences())
                  .filter(
                      (citationID) => !citations.getMeta().includes(citationID)
                  )
                  .sort());
    let options: [string, string][] = $derived.by(() => {
        const list: [string, string][] = [
            [
                uncited.length > 0
                    ? 'Choose references'
                    : 'No uncited references',
                '',
            ],
        ];
        for (const citationID of uncited) list.push([citationID, citationID]);
        return list;
    });
</script>

<Options
    {options}
    bind:value
    changed={handleSelection}
    label="choose citations"
/>
{#each citations.getMeta() as citationID}
    {citationID}
    <Button
        tooltip="Remove citation"
        command={() => removeSelection(citationID)}>&times; citation</Button
    >
{:else}
    <Note>&mdash;</Note>
{/each}
