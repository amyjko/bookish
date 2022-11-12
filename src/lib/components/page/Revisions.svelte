<script lang="ts">
    import { getContext } from "svelte";
    import Parser from "$lib/models/chapter/Parser"
    import { addDraftInFirestore, publishDraftInFirestore } from "$lib/models/Firestore"
    import Format from "$lib/components/chapter/Format.svelte"
    import BookishEditor from "$lib/components/editor/BookishEditor.svelte"
    import Switch from "$lib/components/editor/Switch.svelte"
    import Instructions from "$lib/components/page/Instructions.svelte"
    import { EDITABLE, getEdition } from "./Contexts";

    let edition = getEdition();
    let editable = getContext<boolean>(EDITABLE);
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
    <h2 class="bookish-header" id="revisions">Editions {#if editable}<button on:click={handleDraftEdition}>+</button>{/if}</h2>
    <Instructions>
        Each book has one or more editions, allowing you to track revisions and ensure previous versions remain available.
        When you're ready to revise, make a new edition, then publish it when you're done.
        The edition with a * is the default edition readers will see, unless they explicitly choose to view a previous edition.
    </Instructions>
    <table class="bookish-table">
        <colgroup>
            <col width="5%" />
            <col width="5%" />
            <col width="50%" />
            <col width="35%" />
        </colgroup>
        <tbody>
            {#each bookRevisions as revision, index}
                {@const editionNumber = bookRevisions === undefined ? -1 : bookRevisions.length - index }
                {@const viewing = revision.ref.id === $edition.getRef()?.id }

                {#if editable || revision.published}
                    <tr 
                        class={`${!revision.published ? "bookish-edition-hidden" : ""} ${viewing ? "bookish-edition-editing": ""} `}
                    >
                        <td>
                            <em>{ editionNumber + (editionNumber === 1 ? "st" : editionNumber === 2 ? "nd" : editionNumber === 3 ? "rd" : "th") }</em> <span class="bookish-editor-note">{(new Date(revision.time).toLocaleDateString("en-us"))}</span>
                        </td>
                        <td>
                            {#if editable }
                                {#if viewing }
                                    Editing
                                {:else}
                                    <a href={`/write/${book.ref.id}/${bookRevisions.length - index}`}>Edit</a>
                                {/if}
                            {:else}
                                {#if viewing }
                                    Viewing
                                {:else}
                                    <a href={`/read/${book.ref.id}/${bookRevisions.length - index}`}>View</a>
                                {/if}
                            {/if}
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
                                    position=">"
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