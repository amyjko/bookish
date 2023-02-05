<script lang="ts">
    import Parser from '$lib/models/chapter/Parser';
    import BookishEditor from '$lib/components/editor/BookishEditor.svelte';
    import Instructions from '$lib/components/page/Instructions.svelte';
    import Format from '$lib/components/chapter/Format.svelte';
    import {
        getUser,
        getEdition,
        getLeasee,
        isEditionEditable,
        lease,
    } from './Contexts';
    import PageHeader from './PageHeader.svelte';

    let auth = getUser();
    let edition = getEdition();
    let editable = isEditionEditable();
</script>

<PageHeader id="license">License</PageHeader>

<Instructions {editable}>
    Do you want to specify rights other than your region's default copyrights?
    Edit them here.
</Instructions>

{#if $edition}
    <!-- If editable, show acknowledgements even if they're empty, otherwise hide -->
    {#if editable}
        <!-- svelte-ignore missing-declaration -->
        <BookishEditor
            text={$edition.getLicense()}
            parser={(text) =>
                Parser.parseFormat($edition, text).withTextIfEmpty()}
            save={(node) =>
                $edition
                    ? edition.set($edition.setLicense(node.toBookdown()))
                    : undefined}
            chapter={false}
            component={Format}
            placeholder="license"
            leasee={getLeasee(auth, edition, `license`)}
            lease={(lock) => lease(auth, edition, `license`, lock)}
        />
    {:else}
        <Format
            node={Parser.parseFormat(
                $edition,
                $edition.getLicense()
            ).withTextIfEmpty()}
        />
    {/if}
{/if}
