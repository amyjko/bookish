<script lang="ts">
    import Instructions from "./Instructions.svelte";
    import { getUniqueReferenceID, mineReference } from "$lib/util/mineReference";
    import ReferenceNode from "$lib/models/chapter/ReferenceNode";
    import { getEdition } from "./Contexts";

    let edition = getEdition();
	let text = "";

	function handleBulkAdd() {

		// Split by lines, skipping empty lines.
		const references = text.split(/\n+/).map(line => mineReference(Object.keys($edition.getReferences()), line));

		$edition.addReferences(references)
			.catch(() => {
				alert("Failed to save references.")
			});

	}

	function handleEmptyAdd() {
		$edition.addReferences([new ReferenceNode(getUniqueReferenceID(Object.keys($edition.getReferences())))])
			.catch(() => {
				alert("Failed to save empty reference.");
			})
	}

</script>

<Instructions>
    To cite references in a chapter, add them here.
    You can add one at a time, or try pasting them in bulk, and we'll do our best to pull out the relevant parts, looking for things that look like author lists, years, sources, and URLs.
    Be sure to verify it though &mdash; it's likely to get some things wrong!
</Instructions>
<div>
    <textarea rows={5} bind:value={text} style="width: 100%"></textarea>
    <button disabled={text.length === 0} on:click={handleBulkAdd}>Add bulk references</button>
    <button on:click={handleEmptyAdd}>Add empty reference</button>
</div>