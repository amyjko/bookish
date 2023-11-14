<script lang="ts">
    import Header from './Header.svelte';
    import Outline from './Outline.svelte';
    import Page from './Page.svelte';
    import ChapterIDs from '$lib/models/book/ChapterID';
    import DefinitionView from './DefinitionView.svelte';
    import { getUser, getEdition, isEditionEditable } from './Contexts';
    import Instructions from './Instructions.svelte';
    import Button from '../app/Button.svelte';

    let auth = getUser();
    let edition = getEdition();
    let editable = isEditionEditable();

    $: glossary = $edition?.getGlossary() ?? {};
    // Sort by canonical phrases
    $: keys =
        $edition === undefined
            ? []
            : glossary === undefined || Object.keys(glossary).length === 0
            ? null
            : Object.keys(glossary).sort((a, b) =>
                  glossary[a].phrase.localeCompare(glossary[b].phrase)
              );

    function addEmptyDefinition() {
        if ($edition === undefined) return;
        // Generate an ID.
        const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
        let id = '';
        while (id.length < 4 || $edition.hasDefinition(id))
            id = id + letters[Math.round(Math.random() * 26)];
        edition.set($edition.withDefinition(id, '', '', []));
    }
</script>

{#if $edition}
    <Page title={`${$edition.getTitle()} - Glossary`}>
        <Header
            editable={isEditionEditable() ||
                ($auth !== undefined &&
                    $auth.user !== null &&
                    $edition.isChapterEditor($auth.user.uid))}
            label="Glossary title"
            id="glossary"
            getImage={() => $edition?.getImage(ChapterIDs.GlossaryID) ?? null}
            setImage={(embed) =>
                $edition
                    ? edition.set(
                          $edition.withImage(ChapterIDs.GlossaryID, embed)
                      )
                    : undefined}
            header="Glossary"
            tags={$edition.getTags()}
        >
            <Outline
                slot="outline"
                previous={$edition.getPreviousChapterID(
                    ChapterIDs.GlossaryID,
                    editable
                )}
                next={$edition.getNextChapterID(
                    ChapterIDs.GlossaryID,
                    editable
                )}
            />
        </Header>
        {#if editable}
            <Instructions {editable}>
                Build a glossary here, adding terms, phrases, definitions, and
                synonyms. Then, in a chapter, you can select any text and link
                it to a definition.
            </Instructions>
            <Button tooltip="add glossary entry" command={addEmptyDefinition}
                >+ definition</Button
            >
        {/if}
        {#if keys === null}
            <p>This book has no glossary.</p>
        {:else}
            <dl>
                {#each keys as id (id)}
                    <DefinitionView {id} definition={glossary[id]} />
                {/each}
            </dl>
        {/if}
    </Page>
{/if}
