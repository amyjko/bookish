<script lang="ts">
    import type LabelNode from '$lib/models/chapter/LabelNode';
    import TextEditor from './TextEditor.svelte';
    import { getChapter, getEdition } from '../page/Contexts';
    import { getCaret } from '$lib/components/page/Contexts';

    export let label: LabelNode;

    let edition = getEdition();
    let chapter = getChapter();
    let caret = getCaret();

    $: ast =
        $edition && $chapter ? $chapter.chapter.getAST($edition) : undefined;
</script>

<code>
    <TextEditor
        text={label.getMeta()}
        label="Chapter label ID"
        placeholder="label ID"
        valid={(id) => {
            if (id.length === 0) return "label ID can't be empty";
            if (!/^[a-z]+$/.test(id))
                return 'lable ID can only be a-z characters';
            // If it's different than what it is and there's already one, then error.
            if (
                ast &&
                ast.getLabels().filter((l) => l.getMeta() === id).length >
                    (label.getMeta() === id ? 1 : 0)
            )
                return 'label ID is already used';
        }}
        save={(labelID) => $caret?.edit(label, label.withMeta(labelID))}
        saveOnExit
    />
</code>
