<script lang="ts">
    /** Test-only: mounts the (app) layout with a probe inside it, so the
     *  probe can set the book/edition stores the layout provides. */
    import AppLayout from '../routes/(app)/+layout.svelte';
    import BookContextProbe from './BookContextProbe.svelte';
    import type Book from '$lib/models/book/Book';
    import type Edition from '$lib/models/book/Edition';

    interface Props {
        book?: Book | undefined;
        edition?: Edition | undefined;
    }

    let { book = undefined, edition = undefined }: Props = $props();
</script>

<AppLayout>
    <BookContextProbe {book} {edition} />
</AppLayout>
