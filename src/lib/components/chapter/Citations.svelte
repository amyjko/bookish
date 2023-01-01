<script lang="ts">
    import Marginal from './Marginal.svelte';
    import Parser from '$lib/models/chapter/Parser';
    import type CitationsNode from '$lib/models/chapter/CitationsNode';
    import Problem from './Problem.svelte';
    import Atom from './Atom.svelte';
    import { getChapter, getEdition } from '../page/Contexts';
    import PossibleReference from '../page/PossibleReference.svelte';
    import { afterUpdate } from 'svelte';

    export let node: CitationsNode;

    let chapter = getChapter();
    let edition = getEdition();

    $: chapterNode = $chapter?.chapter.getAST();

    // Sort citations numerically, however they're numbered.
    $: citations = node.getMeta().sort((a, b) => {
        if (chapterNode === undefined) return 0;
        let aNumber = chapterNode.getCitationNumber(a);
        let bNumber = chapterNode.getCitationNumber(b);
        if (aNumber === null) {
            if (bNumber === null) return 0;
            else return 1;
        } else {
            if (bNumber === null) return -1;
            else return aNumber - bNumber;
        }
    });

    // Position the marginals on every render.
    afterUpdate(() => $chapter?.layoutMarginals());
</script>

<Atom {node}>
    {#if chapterNode}
        <span class="bookish-citation" data-nodeid={node.nodeID}>
            <Marginal {node} id={'citation-' + citations.join('-')}>
                <svelte:fragment slot="interactor">
                    {#each citations as citationID, index}
                        {@const citationNumber =
                            chapterNode?.getCitationNumber(citationID)}
                        {#if citationNumber && citationID in ($edition?.getReferences() ?? {})}
                            <sup class="bookish-citation-symbol"
                                >{citationNumber}</sup
                            >
                        {:else}
                            <Problem
                                >Unknown reference: <code>{citationID}</code
                                ></Problem
                            >
                        {/if}
                        {#if citations.length > 1 && index < citations.length - 1}<sup
                                >,</sup
                            >{/if}
                    {:else}
                        <sup class="bookish-citation-symbol">{'\u2014'}</sup>
                    {/each}
                </svelte:fragment>
                <span slot="content" class="bookish-references">
                    {#each citations as citationID}
                        {@const citationNumber =
                            chapterNode?.getCitationNumber(citationID)}
                        {@const ref = $edition?.getReference(citationID)}
                        {#if citationNumber && ref && $edition}
                            <span class="bookish-reference">
                                <sup class="bookish-citation-symbol"
                                    >{citationNumber}</sup
                                >
                                <PossibleReference
                                    node={Parser.parseReference(
                                        citationID,
                                        ref,
                                        $edition,
                                        true
                                    )}
                                />
                            </span>
                        {/if}
                    {/each}
                </span>
            </Marginal>
        </span>
    {/if}
</Atom>

<style>
    .bookish-reference {
        font-family: var(--bookish-paragraph-font-family);
        list-style-position: outside;
    }

    :global(ol li.bookish-reference::before) {
        color: var(--bookish-paragraph-color);
    }

    :global(.bookish-marginal) .bookish-reference {
        font-size: var(--bookish-small-font-size);
        font-style: normal;
        color: var(--bookish-paragraph-color);
    }

    /* This enables us to layout the numbers and letters in a neat right-aligned floating grid. */
    .bookish-reference {
        position: relative;
    }

    .bookish-references .bookish-reference {
        display: block;
        line-height: var(--bookish-paragraph-line-height-tight);
        margin-left: 1rem;
        margin-bottom: 1rem;
        text-align: left;
    }

    .bookish-citation-symbol {
        font-family: var(--bookish-paragraph-font-family);
        font-weight: normal;
        color: var(--bookish-link-color);
        position: relative;
    }

    .bookish-reference .bookish-citation-symbol {
        display: block;
        float: left;
        margin-top: -0.5em;
        position: absolute;
        left: -1.75em;
        text-align: right;
        width: 1.5em; /* Just enough space for 2 digits, a bit of a hack */
    }
</style>
