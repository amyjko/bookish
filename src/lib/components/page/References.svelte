<script lang="ts">
    import Header from "./Header.svelte";
    import Outline from './Outline.svelte';
    import Page from './Page.svelte';
    import Parser from "$lib/models/chapter/Parser";
    import ConfirmButton from '$lib/components/editor/ConfirmButton.svelte';
    import ChapterIDs from '$lib/models/book/ChapterID';
    import { getContext } from "svelte";
    import BulkReferenceEditor from "./BulkReferenceEditor.svelte"
    import PossibleReference from "./PossibleReference.svelte";
    import { EDITABLE, getEdition } from "./Contexts";

    let edition = getEdition();
    let editable = getContext<boolean>(EDITABLE);
    
    $: references = $edition.hasReferences() ? $edition.getReferences() : null;

	// Otherwise, map references to a list with letter headers.
	if(references !== null) {


	}

</script>

<Page title={`${$edition.getTitle()} - References`}>
    <Header 
        label="References title"
        getImage={() => $edition.getImage(ChapterIDs.ReferencesID)}
        setImage={(embed) => $edition.setImage(ChapterIDs.ReferencesID, embed)}
        header="References"
        tags={$edition.getTags()}
    >
        <Outline
            slot="outline"
            previous={$edition.getPreviousChapterID(ChapterIDs.ReferencesID)}
            next={$edition.getNextChapterID(ChapterIDs.ReferencesID)}
        />
    </Header>
    {#if editable }<BulkReferenceEditor />{/if}
    {#if references !== null }
        <p><em>Sorted by last name of first author.</em></p>

        {#each Object.keys(references).sort() as citationID }
            {@const ref = Parser.parseReference(citationID, references === null ? "" : references[citationID], $edition) }
            <!-- {#if letter === undefined || citationID.charAt(0) !== letter) {
                letter = citationID.charAt(0);
                renderedReferences.push(<h2 key={"letter-" + letter} className="bookish-header" id={"references-" + letter}>{letter.toUpperCase()}</h2>);
            } -->

            <p>
                <PossibleReference node={ref} />
                {#if editable}
                    <ConfirmButton
                        commandLabel="x"
                        confirmLabel="Confirm"
                        command={() => $edition.removeReference(citationID)}
                    />
                {/if}
            </p>
        {/each}

    {:else}
        <p>This book has no references.</p>
    {/if}
</Page>