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

    interface Props {
        node: DefinitionNode;
    }

    let { node }: Props = $props();

    let editable = isChapterEditable();
    let edition = getEdition();
    let chapter = getChapter();

    // Find the definition.
    let glossaryID = $derived(node.getMeta());
    let phrase = $derived(node.getText());
    let glossary = $derived($edition?.getGlossary() ?? {});
    let entry = $derived(glossary[glossaryID]);

    // Whenever anything that affects this definition's rendered size or
    // position changes, request a chapter-wide marginal layout pass.
    $effect(() => {
        void phrase;
        void entry;
        $chapter?.requestLayout();
    });
</script>

<!-- Error if there's no corresponding entry. -->
<span class="bookish-definition" data-nodeid={node.nodeID}
    ><Marginal
        {node}
        id={'glossary-' + glossaryID}
        label={entry ? `definition: ${entry.phrase}` : 'undefined phrase'}
        >{#snippet interactor()}<Text node={phrase} />{/snippet}{#snippet content()}<span
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
            >{/snippet}</Marginal
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
