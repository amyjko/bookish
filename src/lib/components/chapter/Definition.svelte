<script lang="ts">
    import Parser from '$lib/models/chapter/Parser'
    import type DefinitionNode from "$lib/models/chapter/DefinitionNode"
    import Text from './Text.svelte'
    import Format from './Format.svelte'
    import Marginal from './Marginal.svelte'
    import { getChapter, getEdition } from '../page/Contexts';
    import { afterUpdate } from 'svelte';

    export let node: DefinitionNode;

    $: glossaryID = node.getMeta();
    $: phrase = node.getText();

    let edition = getEdition();
    let chapter = getChapter();

    // Find the definition.
    let glossary = $edition.getGlossary();
    let entry = glossary[glossaryID];

    // Position the marginals on every render.
    afterUpdate(() => $chapter?.layoutMarginals());

</script>    

<!-- Error if there's no corresponding entry. -->
<span class={`bookish-definition ${entry === undefined ? "bookish-error" : ""}`} data-nodeid={node.nodeID}>
    <Marginal
        id={"glossary-" + glossaryID}
    >
        <slot name="interactor">
            <Text node={phrase}/>
        </slot>
        <slot name="content">
            <span class="bookish-definition-entry">
                {#if entry === undefined }
                    <span class="bookish-error">Unknown glossary entry "{ glossaryID }"</span>
                {:else}
                    <strong class="bookish-definition-entry-phrase">{entry.phrase}</strong>: <Format node={Parser.parseFormat($edition, entry.definition)}/>
                    {#if entry.synonyms && entry.synonyms.length > 0}<span class="bookish-definition-entry-synonyms"><br/><br/>{entry.synonyms.join(", ")}</span>{/if}
                {/if}
            </span>
        </slot>
    </Marginal>
</span>