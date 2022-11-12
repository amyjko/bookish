<script lang="ts">
    import Marginal  from './Marginal.svelte'
    import Parser from '$lib/models/chapter/Parser'
    import type CitationsNode from "$lib/models/chapter/CitationsNode"
    import Atom from './Atom.svelte';
    import { getChapter, getEdition } from '../page/Contexts';
    import PossibleReference from '../page/PossibleReference.svelte';

    export let node: CitationsNode;

    let chapter = getChapter();
    let edition = getEdition();

    $: chapterNode = $chapter.chapter.getAST();

    // Sort citations numerically, however they're numbered.
    let citations = node.getMeta().sort((a, b) => {
        if(chapterNode === undefined) return 0;
        let aNumber = chapterNode.getCitationNumber(a);
        let bNumber = chapterNode.getCitationNumber(b);
        if(aNumber === null) {
            if(bNumber === null) return 0;
            else return 1;
        }
        else {
            if(bNumber === null) return -1;
            else return aNumber - bNumber;
        }
    });

</script>

<Atom {node}>
    {#if chapter }
        <span class="bookish-citation"  data-nodeid={node.nodeID}>
            <Marginal id={"citation-" + citations.join("-")}>
                <slot name="interactor">
                    {#each citations as citationID, index}
                        {@const citationNumber = chapterNode?.getCitationNumber(citationID) }
                        {#if citationNumber !== null && citationID in $edition.getReferences()}
                            <sup class="bookish-citation-symbol">{citationNumber}</sup>
                        {:else}
                            <span class="bookish-error">Unknown reference: <code>{citationID}</code></span>
                        {/if}
                        {#if citations.length > 1 && index < citations.length - 1 }<sup>,</sup>{/if}
                    {:else}
                        <sup class="bookish-citation-symbol">{"\u2014"}</sup>            
                    {/each}
                </slot>
                <slot name="content">
                    <span class="bookish-references">
                        {#each citations as citationID }
                            {@const citationNumber = chapterNode?.getCitationNumber(citationID) }
                            {@const ref = $edition.getReference(citationID) }
                            {#if ref }
                                <span class="bookish-reference">
                                    <sup class="bookish-citation-symbol">{citationNumber}</sup>
                                    <PossibleReference node={Parser.parseReference(citationID, ref, $edition, true)}/>
                                </span>
                            {/if}
                        {/each}
                    </span>
                </slot>
            </Marginal>
        </span>
    {:else}
        <sup class="bookish-error">Citations not allowed in non-chapters</sup>
    {/if}
</Atom>