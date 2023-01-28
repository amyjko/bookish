<script lang="ts">
    import Parser from '$lib/models/chapter/Parser';
    import ChapterBody from '$lib/components/chapter/ChapterBody.svelte';
    import BookishEditor from '$lib/components/editor/BookishEditor.svelte';
    import Instructions from '$lib/components/page/Instructions.svelte';
    import {
        getAuth,
        getEdition,
        getLeasee,
        isEditionEditable,
        lease,
    } from './Contexts';
    import PageHeader from './PageHeader.svelte';

    let auth = getAuth();
    let edition = getEdition();
    let editable = isEditionEditable();

    $: acknowledgements = $edition?.getAcknowledgements();
</script>

<Instructions {editable}>
    Do you have people, communities, or institutions to thank? Do it here. This
    section is not shown if empty.
</Instructions>

<!-- If editable, show acknowledgements even if they're empty, otherwise hide -->
{#if $edition && acknowledgements}
    {#if editable}
        <BookishEditor
            text={acknowledgements}
            parser={(text) => Parser.parseChapter($edition, text)}
            chapter={false}
            component={ChapterBody}
            placeholder="Who would you like to thank?"
            save={(node) =>
                $edition
                    ? edition.set(
                          $edition.withAcknowledgements(node.toBookdown())
                      )
                    : undefined}
            leasee={getLeasee(auth, edition, `acks`)}
            lease={(lock) => lease(auth, edition, `acks`, lock)}
        />
    {:else if acknowledgements.length > 0}
        <PageHeader id="acknowledgements">Acknowledgements</PageHeader>
        <ChapterBody node={Parser.parseChapter($edition, acknowledgements)} />
    {/if}
{/if}
