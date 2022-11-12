<script lang="ts">
    import type InlineCodeNode from "$lib/models/chapter/InlineCodeNode";
    import type CaretContext from "$lib/components/editor/CaretContext";
    import LanguageEditor from "./LanguageEditor.svelte";
    import { getContext } from "svelte";
    import { CARET } from "../page/Symbols";

    export let code: InlineCodeNode;

    let caret = getContext<CaretContext>(CARET);
</script>

<span>
    <LanguageEditor language={code.getMeta()} edit={lang => caret?.edit(code, code.withMeta(lang)) } />
</span>