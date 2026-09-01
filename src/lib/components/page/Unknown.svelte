<script lang="ts">
    import Header from './Header.svelte';
    import Outline from './Outline.svelte';
    import Page from './Page.svelte';
    import Instructions from './Instructions.svelte';
    import ChapterIDs from '$lib/models/book/ChapterID';
    import { getEdition, isEditionEditable } from './Contexts';
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();

    let editable = isEditionEditable();
    let edition = getEdition();
</script>

{#if $edition}
    <Page title={`${$edition.getTitle()} - Unknown Page`}>
        <Header
            editable={isEditionEditable()}
            label="Unknown page title"
            id="unknown"
            getImage={() => $edition?.getImage(ChapterIDs.UnknownID) ?? null}
            setImage={(embed) =>
                $edition
                    ? edition.set(
                          $edition.withImage(ChapterIDs.UnknownID, embed),
                      )
                    : undefined}
            header={$edition.getHeader(ChapterIDs.UnknownID)}
        >
            {#snippet outline()}
                        <Outline  previous={null} next={null} />
                    {/snippet}
        </Header>

        <Instructions {editable}>
            This page will be shown if the reader somehow ends up on a page that
            doesn't exist. You can customize the image shown.
        </Instructions>

        {@render children?.()}
    </Page>
{/if}
