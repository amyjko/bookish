<script lang="ts">
    import type LabelNode from "$lib/models/chapter/LabelNode";
    import TextEditor from "./TextEditor.svelte";
    import { getCaret, getChapter } from "../page/Contexts";

    export let label: LabelNode;

    let chapter = getChapter();
    let caret = getCaret();

    $: ast = $chapter?.chapter.getAST();

</script>

<code>
    <TextEditor 
        startText={label.getMeta()} 
        label="Chapter label ID"
        placeholder="label ID"
        valid={ id => {
            if(id.length === 0) return "Can't be empty";
            if(!/^[a-z]+$/.test(id)) return "Can only be a-z";
            // If it's different than what it is and there's already one, then error.
            if(ast && ast.getLabels().filter(l => l.getMeta() === id).length > (label.getMeta() === id ? 1 : 0)) return "Another label has this ID";
        }}
        save={labelID => $caret?.edit(label, label.withMeta(labelID)) }
        saveOnExit
    />
</code>