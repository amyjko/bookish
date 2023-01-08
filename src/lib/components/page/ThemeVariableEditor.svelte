<script lang="ts">
    import TextEditor from '$lib/components/editor/TextEditor.svelte';
    import { getEdition } from './Contexts';

    const placeholders: Record<string, string> = {
        light: 'CSS color',
        dark: 'CSS color',
        fonts: 'CSS font name',
        sizes: 'CSS font size',
        weights: 'CSS font weights',
        spacing: 'CSS length',
    };

    export let group: string;
    export let name: string;
    export let value: string;

    let edition = getEdition();
</script>

<tr>
    <td
        >{name
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .split(' ')
            .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
            .join(' ')}</td
    >
    <td style="text-align: right">
        <TextEditor
            text={value}
            label={`${name} editor`}
            placeholder={group in placeholders ? placeholders[group] : 'value'}
            valid={() => undefined}
            save={(text) =>
                $edition
                    ? edition.set($edition.withThemeValue(group, name, text))
                    : undefined}
        />
    </td>
</tr>
