<script lang="ts">
    import { setContext } from 'svelte';
    import { writable } from 'svelte/store';
    import BookishEditor from '$lib/components/editor/BookishEditor.svelte';
    import Toolbar from '$lib/components/editor/Toolbar.svelte';
    import ChapterBody from '$lib/components/chapter/ChapterBody.svelte';
    import Parser from '$lib/models/chapter/Parser';
    import { CARET } from '$lib/components/page/Contexts';
    import type CaretState from '$lib/components/editor/CaretState';

    // The active editor context that BookishEditor claims and Toolbar reads.
    const caret = writable<CaretState | undefined>(undefined);
    setContext(CARET, caret);

    // An in-memory document; no persistence involved.
    let text = $state(
        'This is an editable fixture chapter.\n\nEdit me in a test.',
    );
</script>

<main class="bookish">
    <Toolbar caret={$caret} />
    <BookishEditor
        {text}
        parser={(markup) => Parser.parseChapter(undefined, markup)}
        save={(node) => {
            text = node.toBookdown();
        }}
        chapter={true}
        autofocus={true}
        component={ChapterBody}
        placeholder="fixture"
        leasee={false}
        lease={() => true}
    />
</main>

<style>
    main {
        max-width: 40em;
        margin: 4em auto;
    }
</style>
