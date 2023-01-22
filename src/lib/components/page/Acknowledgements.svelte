<script lang="ts">
    import Parser from '$lib/models/chapter/Parser';
    import ChapterBody from '$lib/components/chapter/ChapterBody.svelte';
    import BookishEditor from '$lib/components/editor/BookishEditor.svelte';
    import Instructions from '$lib/components/page/Instructions.svelte';
    import { getEdition, isEditionEditable } from './Contexts';
    import PageHeader from './PageHeader.svelte';

    let edition = getEdition();
    let editable = isEditionEditable();

    $: acknowledgements = $edition?.getAcknowledgements();
    $: acksNode = acknowledgements
        ? Parser.parseChapter($edition, acknowledgements)
        : undefined;
</script>

<Instructions {editable}>
    This section is not shown if empty. But surely you have someone to thank!
</Instructions>

<!-- If editable, show acknowledgements even if they're empty, otherwise hide -->
{#if $edition && acknowledgements && acksNode}
    {#if editable}
        <BookishEditor
            ast={acksNode}
            chapter={false}
            component={ChapterBody}
            placeholder="Who would you like to thank?"
            save={(node) =>
                $edition
                    ? edition.set(
                          $edition.withAcknowledgements(node.toBookdown())
                      )
                    : undefined}
        />
    {:else if acknowledgements.length > 0}
        <PageHeader id="acknowledgements">Acknowledgements</PageHeader>
        <ChapterBody node={acksNode} />
    {/if}
{/if}
