<script lang="ts">
    import type AtomNode from '$lib/models/chapter/AtomNode';
    import { getContext } from 'svelte';
    import type CaretContext from '../editor/CaretContext';
    import { CARET } from '../page/Symbols';

    export let node: AtomNode<any>;

    let caret = getContext<CaretContext>(CARET);

    // Is the caret on this link?
    $: selected = caret && caret.range && caret.range.start.node === node;
    
    function handleMouseDown() {
        // Select this so that the view stays focused.
        // caret.setCaretRange({ start: { node: node, index: 0 }, end: { node: node, index: 0 }});
    }

</script>

<!-- Prevent the editor from receiving the click. -->
<span class={`bookish-editor-atom ${selected ? "bookish-editor-atom-selected" : ""} ${caret?.focused ? "bookish-editor-atom-selected-focused" : ""}`} on:mousedown|stopPropagation={handleMouseDown}><slot></slot></span>