<svelte:options immutable={true} />

<script lang="ts">
    import type AtomNode from '$lib/models/chapter/AtomNode';
    import { getCaret } from '$lib/components/page/Contexts';

    export let node: AtomNode<any>;

    let caret = getCaret();

    // Is the caret on this link?
    $: selected = $caret && $caret.range && $caret.range.start.node === node;
</script>

<!-- Prevent the editor from receiving the click. -->
<span
    class={`bookish-editor-atom ${
        selected ? 'bookish-editor-atom-selected' : ''
    } ${$caret?.focused ? 'bookish-editor-atom-selected-focused' : ''}`}
    ><slot /></span
>

<style>
    .bookish-editor-atom {
        cursor: pointer;
    }

    .bookish-editor-atom-selected {
        border-radius: 2px;
        outline-style: solid;
        outline-color: var(--bookish-paragraph-color);
        outline-offset: 2px;
    }

    .bookish-editor-atom-selected-focused {
        animation: 1s atom-selected infinite;
    }

    @keyframes atom-selected {
        from,
        to {
            outline-width: 2px;
        }
        50% {
            outline-width: 4px;
        }
    }
</style>
