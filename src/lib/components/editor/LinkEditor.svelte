<script lang="ts">
    import type LinkNode from '$lib/models/chapter/LinkNode';
    import URLEditor from './URLEditor.svelte';
    import { getChapter, getEdition, getRoot } from '../page/Contexts';
    import Icon from './Icon.svelte';
    import Button from '../app/Button.svelte';
    import UnlinkIcon from './icons/unlink.svg?raw';
    import Options from '../app/Options.svelte';
    import { getCaret } from '$lib/components/page/Contexts';

    export let link: LinkNode;

    let caret = getCaret();
    let edition = getEdition();

    let chapter = getChapter();
    let root = getRoot();

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
        if (urlOrChapter.length === 0) return "link URL can't be empty";
        if ($edition === undefined) return;

        if (isValidURL(urlOrChapter)) return;

        // If not, is it a valid chapterID?
        if ($edition.hasChapter(urlOrChapter)) return;

        // If not, is it a valid chapterID:label?
        const [chapterID, labelID] = urlOrChapter.split(':');
        if (chapterID === undefined || labelID === undefined) return;

        // The chapter ID is optional; if it's missing, it refers to this chapter.
        const correspondingChapter =
            chapterID === ''
                ? $root
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
                // Include the chapter itself
                options.push([`Chapter: ${chap.getTitle()}`, chap.getID()]);
                const root = chap.getAST($edition);
                if (root) {
                    // Include the chapter's headers
                    const headers = root.getHeaders();
                    for (let number = 0; number < headers.length; number++) {
                        options.push([
                            chap.getTitle() + ': ' + headers[number].toText(),
                            `${chap.getID()}#header-${number}`,
                        ]);
                    }
                    // Include all of the labels in the chapter
                    for (const label of root.getLabels())
                        options.push([
                            chap.getTitle() + ': ' + label.getMeta(),
                            `${chap.getID()}:${label.getMeta()}`,
                        ]);
                }
            }
        }
    }
</script>

<span>
    <Button
        tooltip="remove link"
        command={() => {
            if ($caret?.context?.formatRoot) {
                const newFormat = $caret.context.formatRoot.withSegmentReplaced(
                    link,
                    link.getText(),
                );
                if (newFormat)
                    $caret.edit($caret.context.formatRoot, newFormat);
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
        label="link type"
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
