<script lang="ts">
    import Parser from '$lib/models/chapter/Parser';
    import type DefinitionNode from '$lib/models/chapter/DefinitionNode';
    import Text from './Text.svelte';
    import Format from './Format.svelte';
    import Marginal from './Marginal.svelte';
    import Problem from './Problem.svelte';
    import { getChapter, getEdition } from '../page/Contexts';
    import { afterUpdate } from 'svelte';

    export let node: DefinitionNode;

    let edition = getEdition();
    let chapter = getChapter();

    // Find the definition.
    $: glossaryID = node.getMeta();
    $: phrase = node.getText();
    $: glossary = $edition.getGlossary();
    $: entry = glossary[glossaryID];

    // Position the marginals on every render.
    afterUpdate(() => $chapter?.layoutMarginals());
</script>

<!-- Error if there's no corresponding entry. -->
<span class="bookish-definition" data-nodeid={node.nodeID}>
    <Marginal {node} id={'glossary-' + glossaryID}>
        <Text slot="interactor" node={phrase} /><span
            slot="content"
            class="bookish-definition-entry"
            >{#if entry === undefined}<Problem
                    >Unknown glossary entry "{glossaryID}"</Problem
                >{:else}<strong class="bookish-definition-entry-phrase"
                    >{entry.phrase}</strong
                >: <Format
                    node={Parser.parseFormat($edition, entry.definition)}
                />{#if entry.synonyms && entry.synonyms.length > 0}<span
                        class="bookish-definition-entry-synonyms"
                        ><br /><br />{entry.synonyms.join(', ')}</span
                    >{/if}{/if}</span
        >
    </Marginal>
</span>

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

    .bookish-definition-entry .bookish-definition-entry-synonyms {
        color: var(--bookish-muted-color);
        font-style: italic;
    }
</style>
