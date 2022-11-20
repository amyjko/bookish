<script lang="ts">

    import Parser from "$lib/models/chapter/Parser"
    import ChapterBody from "$lib/components/chapter/ChapterBody.svelte";
    import BookishEditor from "$lib/components/editor/BookishEditor.svelte";
    import Instructions from "$lib/components/page/Instructions.svelte";
    import { getEdition, isEditable } from "./Contexts";

    let edition = getEdition();
    let editable = isEditable();

    $: acknowledgements = $edition.getAcknowledgements();
	$: acksNode = Parser.parseChapter($edition, acknowledgements);

</script>

<h2 class="bookish-header" id="acknowledgements">Acknowledgements</h2>

<Instructions>
    This section is not shown if empty.
    But surely you have someone to thank!
</Instructions>

 <!-- If editable, show acknowledgements even if they're empty, otherwise hide -->
{#if editable }
    <BookishEditor
        ast={acksNode} 
        chapter={false}
        component={ChapterBody}
        placeholder="Who would you like to thank?"
        save={node => $edition.setAcknowledgements(node.toBookdown())}
    />
{:else if acknowledgements.length > 0 }
    <h2 class="bookish-header" id="acknowledgements">Acknowledgements</h2>
    <ChapterBody node={acksNode}/>
{/if}