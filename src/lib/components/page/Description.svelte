<script lang="ts">
    import Parser from '$lib/models/chapter/Parser';
    import ChapterBody from '$lib/components/chapter/ChapterBody.svelte';
    import BookishEditor from '$lib/components/editor/BookishEditor.svelte';
    import {
        getAuth,
        getEdition,
        getLeasee,
        isEditionEditable,
        lease,
    } from './Contexts';

    let auth = getAuth();
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
                leasee={getLeasee(auth, edition, `description`)}
                lease={(lock) => lease(auth, edition, `description`, lock)}
            />
        {:else}
            <ChapterBody
                node={Parser.parseChapter($edition, $edition.getDescription())}
            />
        {/if}
    </section>
{/if}
