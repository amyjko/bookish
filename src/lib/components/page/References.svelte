<script lang="ts">
    import Header from './Header.svelte';
    import Outline from './Outline.svelte';
    import Page from './Page.svelte';
    import ChapterIDs from '$lib/models/book/ChapterID';
    import BulkReferenceEditor from './BulkReferenceEditor.svelte';
    import PossibleReference from './PossibleReference.svelte';
    import { getUser, getEdition, isEditionEditable } from './Contexts';

    let auth = getUser();
    let edition = getEdition();
    let editable = isEditionEditable();

    $: references = $edition?.hasReferences() ? $edition.getReferences() : null;

    // Otherwise, map references to a list with letter headers.
    if (references !== null) {
    }
</script>

{#if $edition}
    <Page title={`${$edition.getTitle()} - References`}>
        <Header
            editable={isEditionEditable() ||
                ($auth !== undefined &&
                    $auth.user !== null &&
                    $edition.isChapterEditor($auth.user.uid))}
            label="References title"
            id="references"
            getImage={() => $edition?.getImage(ChapterIDs.ReferencesID) ?? null}
            setImage={(embed) =>
                $edition
                    ? edition.set(
                          $edition.withImage(ChapterIDs.ReferencesID, embed),
                      )
                    : undefined}
            header={$edition.getHeader(ChapterIDs.ReferencesID)}
            tags={$edition.getTags()}
            save={(text) =>
                $edition
                    ? edition.set(
                          $edition.withHeader(ChapterIDs.ReferencesID, text),
                      )
                    : undefined}
        >
            <Outline
                slot="outline"
                previous={$edition.getPreviousChapterID(
                    ChapterIDs.ReferencesID,
                    editable,
                )}
                next={$edition.getNextChapterID(
                    ChapterIDs.ReferencesID,
                    editable,
                )}
            />
        </Header>
        {#if editable}<BulkReferenceEditor />{/if}
        {#if references !== null}
            {#each Object.keys(references).sort() as citationID (citationID)}
                <PossibleReference node={references[citationID]} edit />
            {/each}
        {:else}
            <p>This book has no references.</p>
        {/if}
    </Page>
{/if}
