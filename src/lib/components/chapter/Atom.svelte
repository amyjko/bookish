<script lang="ts">
    import type AtomNode from '$lib/models/chapter/AtomNode';
    import { getCaret } from '../page/Contexts';

    export let node: AtomNode<any>;

    let caret = getCaret();

    // Is the caret on this link?
    $: selected = $caret && $caret.range && $caret.range.start.node === node;
    
    function handleMouseDown() {
        // Select this so that the view stays focused.
        $caret?.setCaret({ start: { node: node, index: 0 }, end: { node: node, index: 0 }});
    }

</script>

<!-- Prevent the editor from receiving the click. -->
<span class={`bookish-editor-atom ${selected ? "bookish-editor-atom-selected" : ""} ${$caret?.focused ? "bookish-editor-atom-selected-focused" : ""}`} on:mousedown|stopPropagation={handleMouseDown}><slot></slot></span>