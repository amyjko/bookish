<script lang="ts">
    import type LinkNode from '$lib/models/chapter/LinkNode';
    import URLEditor from './URLEditor.svelte';
    import { getChapter, getEdition } from '../page/Contexts';
    import Icon from './Icon.svelte';
    import Button from '../app/Button.svelte';
    import UnlinkIcon from './icons/unlink.svg?raw';
    import Options from '../app/Options.svelte';
    import { getCaret } from '$lib/components/page/Contexts';

    export let link: LinkNode;

    let caret = getCaret();
    let edition = getEdition();

    let chapter = getChapter();

    $: url = link.getMeta();

    function saveEdit(value: string) {
        $caret?.edit(link, link.withMeta(value));
    }

    function isValidURL(url: string) {
        // Is it a valid URL?
        try {
            let test = new URL(url);
            if (test.protocol === 'http:' || test.protocol === 'https:')
                return true;
        } catch (_) {}
        return false;
    }

    function validate(urlOrChapter: string): string | undefined {
        if (urlOrChapter.length === 0) return "Can't be empty.";
        if ($edition === undefined) return;

        if (isValidURL(urlOrChapter)) return;

        // If not, is it a valid chapterID?
        if ($edition.hasChapter(urlOrChapter)) return;

        // If not, is it a valid chapterID:label?
        const [chapterID, labelID] = urlOrChapter.split(':');
        if (chapterID === undefined || labelID === undefined) return;

        // The chapter ID is optional; if it's missing, it refers to this chapter.
        const correspondingChapter =
            chapterID === '' && $chapter
                ? $chapter.chapter.getAST($edition)
                : $edition?.getChapter(chapterID)?.getAST($edition);
        if (correspondingChapter === undefined)
            return 'Not a valid URL or chapter.';

        if (!correspondingChapter.hasLabel(labelID))
            return 'Not a valid chapter label.';
    }

    let options: [string, string][] = [];
    $: {
        options = [];
        // Add an empty option.
        options.push(['External link', url.startsWith('http') ? url : '']);
        // Add an option for each chapter and it's labels.
        if ($edition) {
            for (const chap of $edition?.getChapters() ?? []) {
                options.push([`Chapter: ${chap.getTitle()}`, chap.getID()]);
                for (const label of chap.getAST($edition)?.getLabels() ?? [])
                    options.push([
                        chap.getTitle() + ': ' + label.getMeta(),
                        `${chap.getID()}:${label.getMeta()}`,
                    ]);
            }
        }
    }
</script>

<span>
    <Button
        tooltip="remove link"
        command={() => {
            if ($caret?.context?.format) {
                const newFormat = $caret.context.format.withSegmentReplaced(
                    link,
                    link.getText()
                );
                if (newFormat) $caret.edit($caret.context.format, newFormat);
            }
        }}
    >
        <Icon icon={UnlinkIcon} />
    </Button>
    <Options
        {options}
        changed={(value) => {
            saveEdit(value);
            url = value;
        }}
        value={url}
    />
    <URLEditor
        {url}
        validator={validate}
        edit={(url) => {
            saveEdit(url);
            return undefined;
        }}
    />
</span>
