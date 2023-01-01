<script lang="ts">
    import Parser from '$lib/models/chapter/Parser';
    import BookishEditor from '$lib/components/editor/BookishEditor.svelte';
    import Instructions from '$lib/components/page/Instructions.svelte';
    import Format from '$lib/components/chapter/Format.svelte';
    import { getEdition, isEditable } from './Contexts';
    import PageHeader from './PageHeader.svelte';

    let edition = getEdition();
    let editable = isEditable();

    $: formatNode = $edition
        ? Parser.parseFormat($edition, $edition.getLicense()).withTextIfEmpty()
        : undefined;
</script>

<PageHeader id="license">License</PageHeader>

<Instructions>
    By default of U.S. Copyright Law, your content copyrighted and owned by all
    authors. Edit this if you'd like to grant different rights.
</Instructions>

{#if $edition && formatNode}
    <!-- If editable, show acknowledgements even if they're empty, otherwise hide -->
    {#if editable}
        <BookishEditor
            ast={formatNode}
            save={(node) => $edition?.setLicense(node.toBookdown())}
            chapter={false}
            component={Format}
            placeholder="In the U.S., all rights reserved by default. Want to offer different rights to readers?"
        />
    {:else}
        <Format node={formatNode} />
    {/if}
{/if}
