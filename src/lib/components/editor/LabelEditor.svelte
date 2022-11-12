<script lang="ts">
    import type LabelNode from "$lib/models/chapter/LabelNode";
    import type CaretContext from "$lib/components/editor/CaretContext";
    import TextEditor from "./TextEditor.svelte";
    import { CARET, CHAPTER } from "../page/Symbols";
    import { getContext } from "svelte";
    import type Chapter from "$lib/models/book/Chapter";

    export let label: LabelNode;

    let chapter = getContext<Chapter>(CHAPTER);
    let caret = getContext<CaretContext>(CARET);

    $: ast = chapter.getAST();

</script>

<code>
    <TextEditor 
        text={label.getMeta()} 
        label="Chapter label ID"
        placeholder="label ID"
        valid={ id => {
            if(id.length === 0) return "Can't be empty";
            if(!/^[a-z]+$/.test(id)) return "Can only be a-z";
            // If it's different than what it is and there's already one, then error.
            if(ast && ast.getLabels().filter(l => l.getMeta() === id).length > (label.getMeta() === id ? 1 : 0)) return "Another label has this ID";
        }}
        save={labelID => caret?.edit(label, label.withMeta(labelID)) }
        saveOnExit
    />
</code>