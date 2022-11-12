<script lang="ts">

    import Header from "./Header.svelte";
    import Outline from './Outline.svelte';
    import Page from './Page.svelte';
    import type Edition from '$lib/models/book/Edition'
    import Instructions from './Instructions.svelte';
    import ChapterIDs from '$lib/models/book/ChapterID';
    import { getContext } from "svelte";
    import { EDITION } from "./Contexts";
    import type { Writable } from "svelte/store";

    let edition = getContext<Writable<Edition>>(EDITION);

</script>
<Page title={`${$edition.getTitle()} - Unknown Page`}>
    <Header 
        label="Unknown page title"
        getImage={() => $edition.getImage(ChapterIDs.UnknownID)}
        setImage={embed => $edition.setImage(ChapterIDs.UnknownID, embed)}
        header="Oops."
    >    
        <Outline
            slot="outline"
            previous={null}
            next={null}
        />
    </Header>

    <Instructions>
        This page will be shown if the reader somehow ends up on a page that doesn't exist.
        You can customize the image shown.
    </Instructions>

    <slot></slot>
</Page>