<script lang="ts">
    import Instructions from './Instructions.svelte';
    import {
        getUniqueReferenceID,
        mineReference,
    } from '$lib/util/mineReference';
    import ReferenceNode from '$lib/models/chapter/ReferenceNode';
    import { getEdition } from './Contexts';
    import Button from '../app/Button.svelte';

    let edition = getEdition();
    let text = '';

    function handleBulkAdd() {
        // Split by lines, skipping empty lines.
        const references = text
            .split(/\n+/)
            .map((line) =>
                mineReference(
                    Object.keys($edition?.getReferences() ?? []),
                    line
                )
            );

        $edition
            ?.addReferences(references)
            .catch(() => {
                alert('Failed to save references.');
            })
            .finally(() => (text = ''));
    }

    function handleEmptyAdd() {
        $edition
            ?.addReferences([
                new ReferenceNode(
                    getUniqueReferenceID(Object.keys($edition.getReferences()))
                ),
            ])
            .catch(() => {
                alert('Failed to save empty reference.');
            });
    }
</script>

<Instructions>
    To cite references in a chapter, add them here. You can add one at a time,
    or try pasting them in bulk, and we'll do our best to pull out the relevant
    parts, looking for things that look like author lists, years, sources, and
    URLs. Be sure to verify it though &mdash; it's likely to get some things
    wrong!
</Instructions>

<textarea rows={5} bind:value={text} style="width: 100%" />
<Button
    tooltip="Attempt to convert the text above into references"
    disabled={text.length === 0}
    command={handleBulkAdd}>Add bulk references</Button
>
<Button tooltip="Add an empty reference" command={handleEmptyAdd}
    >Add empty reference</Button
>

<style>
    textarea {
        width: 100%;
        padding: var(--app-chrome-padding);
        font-family: var(--app-font);
        font-size: var(--app-font-size);
        border: none;
        border-top: var(--app-chrome-border-size) solid var(--app-border-color);
        border-bottom: var(--app-chrome-border-size) solid
            var(--app-border-color);
        margin-bottom: var(--app-chrome-padding);
    }

    textarea:focus {
        border-bottom-color: var(--app-interactive-color);
        border-top-color: var(--app-interactive-color);
        outline: none;
    }
</style>
