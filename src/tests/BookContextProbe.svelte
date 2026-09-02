<script lang="ts">
    /**
     * Test-only helper: reads the book/edition stores from context and sets
     * them, so a test can drive the layout's save/debounce effects the way
     * the real editor routes do. Lives outside src/lib so it isn't published.
     */
    import { getBook, getEdition } from '$lib/components/page/Contexts';
    import type Book from '$lib/models/book/Book';
    import type Edition from '$lib/models/book/Edition';

    interface Props {
        book?: Book | undefined;
        edition?: Edition | undefined;
    }

    let { book = undefined, edition = undefined }: Props = $props();

    const bookStore = getBook();
    const editionStore = getEdition();

    $effect(() => {
        if (book) bookStore.set(book);
        if (edition) editionStore.set(edition);
    });
</script>

<!-- Marker so tests can assert the probe actually mounted. -->
<div data-testid="probe">{$bookStore ? 'book set' : 'no book'}</div>
