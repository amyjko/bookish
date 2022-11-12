<script lang="ts">
    import Header from "./Header.svelte"
    import Outline from './Outline.svelte'
    import Page from './Page.svelte'
    import type Edition from '$lib/models/book/Edition.js'
    import ChapterIDs from '$lib/models/book/ChapterID'
    import { getContext } from "svelte";
    import DefinitionView from "./DefinitionView.svelte";
    import { EDITABLE, EDITION } from "./Symbols";
    import type { Writable } from "svelte/store";
    import Instructions from "./Instructions.svelte";

    let edition = getContext<Writable<Edition>>(EDITION);
	let editable = getContext<boolean>(EDITABLE);

	$: glossary = $edition.getGlossary();
	// Sort by canonical phrases
	$: keys = glossary === undefined || Object.keys(glossary).length === 0 ? null : Object.keys(glossary).sort((a, b) => glossary[a].phrase.localeCompare(glossary[b].phrase));
	
	function addEmptyDefinition() {

		// Generate an ID.
		const letters = "abcdefghijklmnopqrstuvwxyz".split("");
		let id = "";
		while(id.length < 4 || $edition.hasDefinition(id))
			id = id + letters[Math.round(Math.random() * 26)];
		$edition.addDefinition(id, "", "", []);

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
    {#if editable }
        <Instructions>
            Add definitions and then link to them in a chapter's text.
        </Instructions>
        <p><button on:click={addEmptyDefinition}>+</button></p>
    {/if}
    {#if keys === null }
        <p>This book has no glossary.</p>
    {:else}
        <div>
            <br/>
            <div class="bookish-table">
                <table>
                    <colgroup>
                        <col style="width: 40%" />
                        <col style="width: 60%" />
                    </colgroup>
                    <tbody>
                        {#each keys as id }<DefinitionView id={id} definition={glossary[id]} />{/each}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}
</Page>
