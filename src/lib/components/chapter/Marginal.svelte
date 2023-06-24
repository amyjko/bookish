<svelte:options immutable={true} />

<script lang="ts">
    import { isMobile, watchMobile } from '$lib/util/isMobile';
    import { onMount } from 'svelte';
    import {
        getCaret,
        getChapter,
        isChapterEditable,
    } from '$lib/components/page/Contexts';
    import type Node from '../../models/chapter/Node';
    import AtomNode from '../../models/chapter/AtomNode';

    export let node: Node;
    export let id: string;
    export let label: string;

    let hovered = false;
    let chapter = getChapter();
    $: editable = isChapterEditable();
    let caret = getCaret();

    // If there's no marginal selected or this is different from the current selection, this is hidden.
    $: selectedMarginal = $chapter?.marginal;
    $: isHidden = editable
        ? // If editable, it's hidden if the caret is not inside the marginal content.
          !(
              $caret?.range?.start.node === node ||
              $caret?.range?.start.node
                  .getAncestors($caret.root)
                  .some((ancestor) => ancestor === node)
          )
        : // If not editable, it's hidden if it's not selected.
          $selectedMarginal !== id;

    function toggle(event: MouseEvent | undefined, interactor: boolean) {
        if (editable) {
            if (interactor) {
                if (editable && $caret && node instanceof AtomNode) {
                    // Select this so that the view stays focused.
                    $caret.setCaret({
                        start: { node, index: 0 },
                        end: { node, index: 0 },
                    });
                    if (event) {
                        event.stopPropagation();
                        event.preventDefault();
                    }
                }
                return;
            }
        }

        if ($chapter) {
            if (isMobile() && isHidden) $chapter.marginal.set(id);
            // Otherwise, deselect.
            else $chapter.marginal.set(undefined);
        }
    }

    function handleEnter() {
        hovered = true;
    }
    function handleExit() {
        hovered = false;
    }

    onMount(() => {
        const mediaWatch = watchMobile();
        mediaWatch.addEventListener('change', () => toggle(undefined, false));

        return () =>
            mediaWatch.removeEventListener('change', () =>
                toggle(undefined, false)
            );
    });
</script>

<span
    class={`bookish-marginal-interactor ${
        hovered ? ' bookish-marginal-hovered' : ''
    } ${isHidden ? '' : 'bookish-marginal-selected'} ${
        editable ? '' : 'interactive'
    }`}
    aria-label={label}
    role="button"
    tabindex="0"
    on:mousedown={(event) => toggle(event, true)}
    on:keydown={(event) =>
        event.key === 'Enter' || event.key === ' '
            ? toggle(undefined, true)
            : undefined}
    on:mouseenter={handleEnter}
    on:mouseleave={handleExit}><slot name="interactor" /></span
><span
    class={'bookish-marginal' +
        (isHidden ? ' bookish-marginal-hidden' : '') +
        (hovered ? ' bookish-marginal-hovered' : '')}
    role="button"
    tabindex={editable ? null : 0}
    on:mousedown={() => toggle(undefined, false)}
    on:keydown={(event) =>
        event.key === 'Enter' || event.key === ' '
            ? toggle(undefined, false)
            : undefined}
    on:mouseenter={handleEnter}
    on:mouseleave={handleExit}
>
    <slot name="content" />
</span>

<style>
    :global(.bookish-definition)
        .bookish-marginal-interactor.bookish-marginal-hovered {
        border-bottom-color: var(--bookish-link-color) !important;
        border-bottom-width: 3px;
    }

    /* Mobile */
    @media screen and (max-width: 1200px) {
        /* Fixed position for small screens. */
        .bookish-marginal {
            background-color: var(--bookish-background-color);
            padding: 0.75em;
            position: fixed;
            width: auto;
            height: auto;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 2;
            transform: translateY(0);
            transition: transform 0.2s ease-in;
        }

        .interactive {
            cursor: pointer;
        }

        /* Handle nested marginals by just not showing them. */
        .bookish-marginal :global(.bookish-marginal) {
            display: none;
        }

        .bookish-marginal-interactor:hover {
            font-weight: bold;
        }

        :global(.bookish-definition) .bookish-marginal-interactor:hover {
            font-weight: normal;
        }

        :global(.bookish-definition:hover) {
            border-bottom-color: var(--bookish-border-color-bold) !important;
        }

        .bookish-marginal-hidden {
            transform: translateY(100%);
            transition: transform 0.2s ease-out;
            height: 0;
            bottom: 0;
        }
    }

    /* Desktop */
    @media screen and (min-width: 1200px) {
        /* On larger screens, put marginal right things in the right margin. */
        .bookish-marginal {
            float: right;
            width: 12rem;
            display: block;
            padding-bottom: 0.5rem;
            position: absolute;
        }

        :global(
                .bookish-definition
                    .bookish-marginal.bookish-marginal-hovered
                    .bookish-definition-entry
            ) {
            background: linear-gradient(
                    to right,
                    var(--bookish-link-color) 0px,
                    var(--bookish-link-color) 3px,
                    transparent 3px
                )
                no-repeat right;
        }
    }

    /* A little circle around the citation and footer symbols, when hovered on a device that supports hovering. */
    @media (hover: hover) {
        .bookish-marginal-interactor.bookish-marginal-hovered
            :global(.bookish-citation-symbol:before),
        .bookish-marginal-interactor.bookish-marginal-hovered
            :global(.bookish-footnote-symbol:before),
        .bookish-marginal-interactor.bookish-marginal-hovered
            :global(.bookish-comment-symbol:before) {
            opacity: 0.3;
        }
    }

    /* A little circle around the citation and footer symbols, when hovered */
    .bookish-marginal-interactor.bookish-marginal-selected
        :global(.bookish-citation-symbol:before),
    .bookish-marginal-interactor.bookish-marginal-selected
        :global(.bookish-footnote-symbol:before),
    .bookish-marginal-interactor.bookish-marginal-selected
        :global(.bookish-comment-symbol:before) {
        opacity: 0.7;
    }

    .bookish-marginal-interactor :global(.bookish-citation-symbol:before),
    .bookish-marginal-interactor :global(.bookish-footnote-symbol:before),
    .bookish-marginal-interactor :global(.bookish-comment-symbol:before) {
        content: '';
        width: 3em;
        height: 3em;
        top: -1em;
        left: calc(-1.5em + 50%); /* Centered plus half of the span width */
        border-radius: 3em;
        position: absolute;
        z-index: -1;
        opacity: 0;
        background-color: var(--bookish-highlight-color);
        transition: opacity 0.2s;
    }
</style>
