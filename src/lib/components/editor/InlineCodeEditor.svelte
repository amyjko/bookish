<script lang="ts">
    import type InlineCodeNode from '$lib/models/chapter/InlineCodeNode';
    import LanguageEditor from './LanguageEditor.svelte';
    import { getCaret } from '../page/Contexts';

    export let code: InlineCodeNode;

    let caret = getCaret();
</script>

<span>
    <LanguageEditor
        language={code.getMeta()}
        edit={(lang) => $caret?.edit(code, code.withMeta(lang))}
    />
</span>
