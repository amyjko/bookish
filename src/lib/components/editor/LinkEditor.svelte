<script lang="ts">
    import type LinkNode from "$lib/models/chapter/LinkNode";
    import URLEditor from "./URLEditor.svelte";
    import { getCaret, getChapter, getEdition } from "../page/Contexts";
    import ToolbarIcon from "./ToolbarIcon.svelte";

    export let link: LinkNode;

    let caret = getCaret();
    let edition = getEdition();
    let chapter = getChapter();

    $: url = link.getMeta();

    function saveEdit(value: string) {
        $caret?.edit(link, link.withMeta(value));
    }

    function handleChapterChange(e: Event) {
        const target = e.target as HTMLSelectElement;
        saveEdit(target.value);
    }

    function isValidURL(url: string) {
        // Is it a valid URL?
        try {
            let test = new URL(url);
            if(test.protocol === "http:" || test.protocol === "https:")
                return true;
        } catch (_) {}
        return false;
    }

    function getURLError(urlOrChapter: string): string | undefined {

        if(urlOrChapter.length === 0) 
            return "Can't be empty.";

        if(isValidURL(urlOrChapter))
            return;

        // If not, is it a valid chapterID?
        if($edition.hasChapter(urlOrChapter))
            return;

        // If not, is it a valid chapterID:label?
        const [ chapterID, labelID ] = urlOrChapter.split(":");
        if(chapterID === undefined || labelID === undefined)
            return;

        // The chapter ID is optional; if it's missing, it refers to this chapter.
        const correspondingChapter = chapterID === "" ? chapter.getAST() : $edition.getChapter(chapterID)?.getAST();
        if(correspondingChapter === undefined)
            return "Not a valid URL or chapter.";
        
        if(!correspondingChapter.hasLabel(labelID))
            return "Not a valid chapter label."

    }

</script>

<span>
    <button 
        title="Remove link."
        on:click={() => {
            if($caret?.context?.format) {
                const newFormat = $caret.context.format.withSegmentReplaced(link, link.getText());
                if(newFormat)
                    $caret.edit($caret.context.format, newFormat);
            }
        }}
    >
        <ToolbarIcon name="unlink.svg"/>
    </button>
    <select name="chapterID" on:change={handleChapterChange} value={url}>
        <option value="">URL</option>
        <option value={$chapter.chapter.getChapterID()}>{$chapter.chapter.getTitle()}</option>
        <!-- Build the list of options (chapters and then any of the chapter's labels.) -->
        {#each $edition.getChapters() as chapter }     
            {#each chapter.getAST()?.getLabels() ?? [] as label }
                <option value={`${chapter.getChapterID()}:${label.getMeta()}`}>{chapter.getTitle() + ": " + label.getMeta()}</option>
            {/each}
        {/each}
    </select>
    <code>
        <URLEditor url={url} validator={getURLError} edit={ url => { saveEdit(url); return undefined; }} />
    </code>
</span>