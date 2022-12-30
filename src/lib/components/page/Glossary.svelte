<script lang="ts">
    import Header from './Header.svelte';
    import Outline from './Outline.svelte';
    import Page from './Page.svelte';
    import ChapterIDs from '$lib/models/book/ChapterID';
    import DefinitionView from './DefinitionView.svelte';
    import { getEdition, isEditable } from './Contexts';
    import Instructions from './Instructions.svelte';
    import Button from '../app/Button.svelte';
    import Rows from './Rows.svelte';

    let edition = getEdition();
    let editable = isEditable();

    $: glossary = $edition.getGlossary();
    // Sort by canonical phrases
    $: keys =
        glossary === undefined || Object.keys(glossary).length === 0
            ? null
            : Object.keys(glossary).sort((a, b) =>
                  glossary[a].phrase.localeCompare(glossary[b].phrase)
              );

    function addEmptyDefinition() {
        // Generate an ID.
        const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
        let id = '';
        while (id.length < 4 || $edition.hasDefinition(id))
            id = id + letters[Math.round(Math.random() * 26)];
        $edition.addDefinition(id, '', '', []);
    }
</script>

<Page title={`${$edition.getTitle()} - Glossary`}>
    <Header
        label="Glossary title"
        getImage={() => $edition.getImage(ChapterIDs.GlossaryID)}
        setImage={(embed) => $edition.setImage(ChapterIDs.GlossaryID, embed)}
        header="Glossary"
        tags={$edition.getTags()}
    >
        <Outline
            slot="outline"
            previous={$edition.getPreviousChapterID(ChapterIDs.GlossaryID)}
            next={$edition.getNextChapterID(ChapterIDs.GlossaryID)}
        />
    </Header>
    {#if editable}
        <Instructions>
            Add definitions and then link to them in a chapter's text.
        </Instructions>
        <Button tooltip="Add a glossary entry" command={addEmptyDefinition}
            >Add definition</Button
        >
    {/if}
    {#if keys === null}
        <p>This book has no glossary.</p>
    {:else}
        <Rows>
            {#each keys as id}
                <DefinitionView {id} definition={glossary[id]} />
            {/each}
        </Rows>
    {/if}
</Page>
