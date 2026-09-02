<script lang="ts">
    /** Test-only: the real component stack of /write/[bookid] plus a context
     *  capture, so tests can deliver listener snapshots and local edits in a
     *  controlled order and observe the edition store. */
    import AppLayout from '../routes/(app)/+layout.svelte';
    import BookLoader from '$lib/components/page/BookLoader.svelte';
    import EditionLoader from '$lib/components/page/EditionLoader.svelte';
    import TableOfContents from '$lib/components/page/TableOfContents.svelte';
    import ContextCapture from './ContextCapture.svelte';
</script>

<AppLayout>
    <ContextCapture />
    <BookLoader>
        <EditionLoader write={true}>
            <TableOfContents />
        </EditionLoader>
    </BookLoader>
</AppLayout>
