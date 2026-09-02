<script lang="ts">
    /** Test-only: the real component stack of /write/[bookid] — the app
     *  layout wrapping BookLoader, EditionLoader, and the table of contents
     *  page — so tests can catch effect cycles anywhere in the tree. */
    import AppLayout from '../routes/(app)/+layout.svelte';
    import BookLoader from '$lib/components/page/BookLoader.svelte';
    import EditionLoader from '$lib/components/page/EditionLoader.svelte';
    import TableOfContents from '$lib/components/page/TableOfContents.svelte';
</script>

<AppLayout>
    <BookLoader>
        <EditionLoader write={true}>
            <TableOfContents />
        </EditionLoader>
    </BookLoader>
</AppLayout>
