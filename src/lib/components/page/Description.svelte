<script lang="ts">
    import Parser from '$lib/models/chapter/Parser';
    import ChapterBody from '$lib/components/chapter/ChapterBody.svelte';
    import BookishEditor from '$lib/components/editor/BookishEditor.svelte';
    import { getEdition, isEditable } from './Contexts';

    let editable = isEditable();
    let edition = getEdition();

    $: descriptionNode = Parser.parseChapter(
        $edition,
        $edition.getDescription()
    );
</script>

<div class="bookish-description">
    {#if editable}
        <BookishEditor
            ast={descriptionNode}
            save={(node) => $edition.setDescription(node.toBookdown())}
            chapter={false}
            component={ChapterBody}
            placeholder="What this book about?"
        />
    {:else}
        <ChapterBody node={descriptionNode} />
    {/if}
</div>
