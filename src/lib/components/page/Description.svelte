<script lang="ts">
    import Parser from '$lib/models/chapter/Parser';
    import ChapterBody from '$lib/components/chapter/ChapterBody.svelte';
    import BookishEditor from '$lib/components/editor/BookishEditor.svelte';
    import { getEdition, isEditionEditable } from './Contexts';

    let editable = isEditionEditable();
    let edition = getEdition();
</script>

{#if $edition}
    <section class="bookish-description">
        {#if editable}
            <BookishEditor
                text={$edition.getDescription()}
                parser={(text) => Parser.parseChapter($edition, text)}
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
            <ChapterBody
                node={Parser.parseChapter($edition, $edition.getDescription())}
            />
        {/if}
    </section>
{/if}
