<script lang="ts">
    import type CodeNode from "$lib/models/chapter/CodeNode";
    import LanguageEditor from "./LanguageEditor.svelte";
    import PositionEditor from "./PositionEditor.svelte";
    import Switch from "$lib/components/editor/Switch.svelte";
    import { CARET } from "../page/Symbols";
    import type CaretContext from "./CaretContext";
    import { getContext } from "svelte";

    export let code: CodeNode;

    let caret = getContext<CaretContext>(CARET);

</script>
<span>
    <PositionEditor
        value={code.getPosition()}
        edit={value => caret?.edit(code, code.withPosition(value)) }
    />
    <LanguageEditor language={code.getLanguage()} edit={lang => caret?.edit(code, code.withLanguage(lang)) } />
    {#if code.getLanguage() === "python"}
        <Switch
            options={["executable", "read only"]}
            value={code.isExecutable() ? "executable" : "read only"}
            position=">"
            edit={value => caret?.edit(code, code.withExecutable(value === "executable")) }
        />
    {/if}
</span>