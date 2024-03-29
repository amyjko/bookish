<svelte:options immutable={true} />

<script lang="ts">
    import Parser from '$lib/models/chapter/Parser';
    import type DefinitionNode from '$lib/models/chapter/DefinitionNode';
    import Text from './Text.svelte';
    import Format from './Format.svelte';
    import Marginal from './Marginal.svelte';
    import Problem from './Problem.svelte';
    import {
        getChapter,
        getEdition,
        isChapterEditable,
    } from '../page/Contexts';
    import { afterUpdate } from 'svelte';

    export let node: DefinitionNode;

    let editable = isChapterEditable();
    let edition = getEdition();
    let chapter = getChapter();

    // Find the definition.
    $: glossaryID = node.getMeta();
    $: phrase = node.getText();
    $: glossary = $edition?.getGlossary() ?? {};
    $: entry = glossary[glossaryID];

    // Position the marginals on every render.
    afterUpdate(() => $chapter?.layoutMarginals());
</script>

<!-- Error if there's no corresponding entry. -->
<span class="bookish-definition" data-nodeid={node.nodeID}
    ><Marginal
        {node}
        id={'glossary-' + glossaryID}
        label={entry ? `definition: ${entry.phrase}` : 'undefined phrase'}
        ><Text slot="interactor" node={phrase} /><span
            slot="content"
            class="bookish-definition-entry"
            >{#if entry === undefined}<Problem
                    >{#if editable}{glossaryID.length === 0
                            ? 'choose a definition'
                            : `unknown glossary ID ${glossaryID}`}{:else}<em
                            >missing definition</em
                        >{/if}</Problem
                >{:else}<strong class="bookish-definition-entry-phrase"
                    >{entry.phrase}</strong
                >: <Format
                    node={Parser.parseFormat($edition, entry.definition)}
                />{#if entry.synonyms && entry.synonyms.length > 0}<p
                        class="synonyms">{entry.synonyms.join(', ')}</p
                    >{/if}{/if}</span
        ></Marginal
    ></span
>

<style>
    .bookish-definition :global(.bookish-marginal-interactor) {
        border-bottom: 2px solid var(--bookish-link-color);
    }

    .bookish-definition-entry {
        display: block;
        padding-left: 0.75rem;
        font-size: var(--bookish-small-font-size);
        line-height: var(--bookish-paragraph-line-height-tight);
        text-align: left;
        margin-left: 0.25rem;
        margin-bottom: 1rem;
        background: linear-gradient(
                to right,
                var(--bookish-link-color) 0px,
                var(--bookish-link-color) 2px,
                transparent 2px
            )
            no-repeat right;
    }

    .synonyms {
        color: var(--bookish-muted-color);
        font-style: italic;
        margin-top: var(--bookish-paragraph-spacing);
    }
</style>
