<script lang="ts">
    import Header from './Header.svelte';
    import Outline from './Outline.svelte';
    import Page from './Page.svelte';
    import ChapterIDs from '$lib/models/book/ChapterID';
    import DefinitionView from './DefinitionView.svelte';
    import {
        getAuth,
        getEdition,
        isChapterEditable,
        isEditionEditable,
    } from './Contexts';
    import Instructions from './Instructions.svelte';
    import Button from '../app/Button.svelte';

    let auth = getAuth();
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
                previous={$edition.getPreviousChapterID(ChapterIDs.GlossaryID)}
                next={$edition.getNextChapterID(ChapterIDs.GlossaryID)}
            />
        </Header>
        {#if editable}
            <Instructions {editable}>
                Add definitions and then link to them in a chapter's text.
            </Instructions>
            <Button tooltip="Add a glossary entry" command={addEmptyDefinition}
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
