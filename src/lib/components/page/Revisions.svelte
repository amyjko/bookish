<script lang="ts">
    import Parser from "$lib/models/chapter/Parser"
    import { addDraftInFirestore, publishDraftInFirestore } from "$lib/models/Firestore"
    import Format from "$lib/components/chapter/Format.svelte"
    import BookishEditor from "$lib/components/editor/BookishEditor.svelte"
    import Switch from "$lib/components/editor/Switch.svelte"
    import Instructions from "$lib/components/page/Instructions.svelte"
    import Note from "../editor/Note.svelte"
    import { getEdition, isEditable } from "./Contexts";
    import Button from "../app/Button.svelte";
    import Link from "../Link.svelte";

    let edition = getEdition();
    let editable = isEditable();
    $: book = $edition.getBook();

	// Legacy revisions
	$: editionRevisions = $edition.getRevisions();

	// Book revisions
	$: bookRevisions = book?.getRevisions();

	// Copy the current draft to create a new draft.
	function handlePublish(index: number, published: boolean) {

		if(book === undefined) return;
		publishDraftInFirestore(book, index, published);

	}

	function handleDraftEdition() {
		if(book === undefined) return;
		addDraftInFirestore(book);
	}

</script>

{#if editionRevisions.length > 0 }
    <h2 class="bookish-header" id="revisions">Revisions</h2>
    <ul>
        {#each editionRevisions as revision }
            <li><em>{revision[0]}</em>. <Format node={Parser.parseFormat($edition, revision[1])} /></li>
        {/each}
    </ul>
{/if}
{#if book && bookRevisions}
    <h2 class="bookish-header" id="revisions">Editions {#if editable}<Button tooltip="Create a new edition" command={handleDraftEdition}>+</Button>{/if}</h2>
    <Instructions>
        Each book has one or more editions, allowing you to track revisions and ensure previous versions remain available.
        When you're ready to revise, make a new edition, then publish it when you're done.
        The edition with a * is the default edition readers will see, unless they explicitly choose to view a previous edition.
    </Instructions>
    <table class="bookish-table">
        <colgroup>
            <col width="5%" />
            <col width="65%" />
            <col width="30%" />
        </colgroup>
        <tbody>
            {#each bookRevisions as revision, index}
                {@const editionNumber = bookRevisions === undefined ? -1 : bookRevisions.length - index }
                {@const editionLabel = editionNumber + (editionNumber === 1 ? "st" : editionNumber === 2 ? "nd" : editionNumber === 3 ? "rd" : "th") }
                {@const viewing = revision.ref.id === $edition.getRef()?.id }

                {#if editable || revision.published}
                    <tr>
                        <td>
                            {#if viewing}
                                <strong class="viewing">{editionLabel}</strong>
                            {:else}
                                <Link to={`/write/${book.ref.id}/${bookRevisions.length - index}`}>{editionLabel}</Link>
                            {/if}
                            <Note>{(new Date(revision.time).toLocaleDateString("en-us"))}</Note>
                        </td>
                        <td>
                            { #if editable }
                                <BookishEditor 
                                    ast={Parser.parseFormat(undefined, revision.summary).withTextIfEmpty()}
                                    save={ newSummary => book ? book.setEditionChangeSummary(newSummary.toBookdown(), index) : undefined }
                                    chapter={false}
                                    component={Format}
                                    placeholder="Summarize this edition's changes."
                                /> 
                            {:else}
                                {#if revision.summary === ""}
                                    <em>No summary of changes</em>
                                {:else}
                                    { revision.summary }
                                {/if}
                            {/if}
                        </td>
                        <td style="whitespace: nowrap">
                            {#if editable}
                                <Switch
                                    options={["hidden", "published"]} 
                                    enabled={revision.published || revision.summary !== ""}
                                    value={revision.published ? "published" : "hidden"} 
                                    edit={ published => handlePublish(index, published === "published") }
                                />
                                {#if revision === bookRevisions.find(e => e.published)}*{/if}
                            {/if}
                        </td>
                    </tr>
                {/if}
            {/each}
        </tbody>
    </table>
{/if}


<style>
    .viewing {
        border-bottom: var(--app-chrome-border-size) solid var(--app-border-color);
    }
</style>