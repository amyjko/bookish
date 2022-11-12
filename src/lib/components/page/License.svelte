<script lang="ts">

    import { getContext } from "svelte";
    import type Edition from "$lib/models/book/Edition"
    import Parser from "$lib/models/chapter/Parser"
    import BookishEditor from "$lib/components/editor/BookishEditor.svelte";
    import Instructions from "$lib/components/page/Instructions.svelte";
    import Format from "$lib/components/chapter/Format.svelte";
    import { EDITABLE, EDITION } from "./Symbols";
    import type { Writable } from "svelte/store";

    let edition = getContext<Writable<Edition>>(EDITION);
    let editable = getContext<boolean>(EDITABLE);

    let formatNode = Parser.parseFormat($edition, $edition.getLicense()).withTextIfEmpty();

</script>

<h2 class="bookish-header" id="license">License</h2>

<Instructions>
    By default of U.S. Copyright Law, your content copyrighted and owned by all authors. 
    Edit this if you'd like to grant different rights.
</Instructions>

 <!-- If editable, show acknowledgements even if they're empty, otherwise hide -->
{#if editable }
    <BookishEditor
        ast={formatNode} 
        save={node => $edition.setLicense(node.toBookdown())}
        chapter={false}
        component={Format}
        placeholder="In the U.S., all rights reserved by default. Want to offer different rights to readers?"
    />
{:else}
    <Format node={formatNode} />
{/if}