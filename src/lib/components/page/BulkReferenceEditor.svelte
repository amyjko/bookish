<script lang="ts">
    import Instructions from './Instructions.svelte';
    import {
        getUniqueReferenceID,
        mineReference,
    } from '$lib/util/mineReference';
    import Reference from '$lib/models/book/Reference';
    import {
        getEdition,
        isEditionEditable,
        isEditionPartiallyEditable,
    } from './Contexts';
    import Button from '../app/Button.svelte';

    let edition = getEdition();
    let text = '';
    let editable = isEditionEditable() || isEditionPartiallyEditable();

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

        if ($edition) {
            edition.set($edition.withNewReferences(references));
            text = '';
        }
    }

    function handleEmptyAdd() {
        if ($edition) {
            edition.set(
                $edition.withNewReferences([
                    new Reference(
                        getUniqueReferenceID(
                            Object.keys($edition.getReferences())
                        )
                    ),
                ])
            );
        }
    }
</script>

<Instructions {editable}>
    To add references to a chapter, add them here first. You can add one at a
    time, or try pasting them in bulk, and this page will try to pull out author
    lists, years, sources, and URLs. Be sure to verify it though &mdash; it's
    likely to get some things wrong.
</Instructions>

<textarea rows={5} bind:value={text} style="width: 100%" />
<Button
    tooltip="convert to references"
    disabled={text.length === 0}
    command={handleBulkAdd}>+ bulk references</Button
>
<Button tooltip="add empty reference" command={handleEmptyAdd}
    >+ empty reference</Button
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
