<script lang="ts">
    import Parser from '$lib/models/chapter/Parser';
    import ChapterBody from '$lib/components/chapter/ChapterBody.svelte';
    import BookishEditor from '$lib/components/editor/BookishEditor.svelte';
    import { getEdition, isEditable } from './Contexts';

    let editable = isEditable();
    let edition = getEdition();

    $: descriptionNode = $edition
        ? Parser.parseChapter($edition, $edition.getDescription())
        : undefined;
</script>

{#if descriptionNode}
    <section class="bookish-description">
        {#if editable}
            <BookishEditor
                ast={descriptionNode}
                save={(node) =>
                    $edition
                        ? edition.set(
                              $edition?.setDescription(node.toBookdown())
                          )
                        : undefined}
                chapter={false}
                component={ChapterBody}
                placeholder="What is this book about?"
            />
        {:else}
            <ChapterBody node={descriptionNode} />
        {/if}
    </section>
{/if}
