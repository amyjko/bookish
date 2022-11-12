<script lang="ts">
    import type Edition from "$lib/models/book/Edition";
    import Parser from "$lib/models/chapter/Parser";
    import ChapterBody from "$lib/components/chapter/ChapterBody.svelte";
    import BookishEditor from "$lib/components/editor/BookishEditor.svelte";
    import { getContext } from "svelte";
    import { EDITABLE, EDITION } from "./Symbols";
    import type { Writable } from "svelte/store";

    let editable = getContext<boolean>(EDITABLE);
    let edition = getContext<Writable<Edition>>(EDITION);

	const descriptionNode = Parser.parseChapter($edition, $edition.getDescription());

</script>

<div class="bookish-description">
    {#if editable}
        <BookishEditor 
            ast={descriptionNode} 
            save={node => $edition.setDescription(node.toBookdown())}
            chapter={false}
            component={ChapterBody}
            placeholder="What this book about?"
        />
    {:else}
        <ChapterBody node={descriptionNode}/>
    {/if}
</div>