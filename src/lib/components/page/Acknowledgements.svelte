<script lang="ts">
    import Parser from '$lib/models/chapter/Parser';
    import ChapterBody from '$lib/components/chapter/ChapterBody.svelte';
    import BookishEditor from '$lib/components/editor/BookishEditor.svelte';
    import Instructions from '$lib/components/page/Instructions.svelte';
    import {
        getUser,
        getEdition,
        getLeasee,
        isEditionEditable,
        lease,
    } from './Contexts';
    import PageHeader from './PageHeader.svelte';
    import EditableHeader from './EditableHeader.svelte';

    let auth = getUser();
    let edition = getEdition();
    let editable = isEditionEditable();

    $: acknowledgements = $edition?.getAcknowledgements();
</script>

<Instructions {editable}>
    Do you have people, communities, or institutions to thank? Do it here. This
    section is not shown if empty.
</Instructions>

<!-- If editable, show acknowledgements even if they're empty, otherwise hide -->
{#if $edition}
    {#if editable}
        <EditableHeader
            id="acknowledgements"
            label="Edit acknowledgements header"
        />
        <BookishEditor
            text={acknowledgements ?? ''}
            parser={(text) => Parser.parseChapter($edition, text)}
            chapter={false}
            component={ChapterBody}
            placeholder="Who would you like to thank?"
            save={(node) =>
                $edition
                    ? edition.set(
                          $edition.withAcknowledgements(node.toBookdown()),
                      )
                    : undefined}
            leasee={getLeasee(auth, edition, `acks`)}
            lease={(lock) => lease(auth, edition, `acks`, lock)}
        />
    {:else if acknowledgements && acknowledgements.length > 0}
        <PageHeader id="acknowledgements"
            >{$edition.getHeader('acknowledgements')}</PageHeader
        >
        <ChapterBody node={Parser.parseChapter($edition, acknowledgements)} />
    {/if}
{/if}
