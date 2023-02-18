<script lang="ts">
    import Header from './Header.svelte';
    import Outline from './Outline.svelte';
    import Page from './Page.svelte';
    import {
        BookishTheme,
        CriticalTheme,
        HumanTheme,
        SeriousTheme,
        SketchyTheme,
        TechTheme,
    } from '$lib/models/book/Theme';
    import ConfirmButton from '$lib/components/editor/ConfirmButton.svelte';
    import Instructions from './Instructions.svelte';
    import ThemeSetEditor from './ThemeSetEditor.svelte';
    import ThemeEditorPreview from './ThemeEditorPreview.svelte';
    import { getEdition, isEditionEditable } from './Contexts';
    import TextEditor from '../editor/TextEditor.svelte';
    import type Theme from '$lib/models/book/Theme';
    import Button from '../app/Button.svelte';
    import Switch from '../editor/Switch.svelte';
    import Link from '../app/Link.svelte';
    import Rows from './Rows.svelte';

    const themes: Record<string, Theme> = {
        Bookish: BookishTheme,
        Serious: SeriousTheme,
        Tech: TechTheme,
        Human: HumanTheme,
        Sketchy: SketchyTheme,
        Critical: CriticalTheme,
    };

    let editable = isEditionEditable();
    let edition = getEdition();
    $: theme = $edition ? $edition.getTheme() : null;
    $: isDefault =
        theme === null || Object.values(themes).includes(theme as Theme);

    function getEmptyGroup(group: Record<string, string>) {
        const empty: Record<string, string> = {};
        for (const key in Object.keys(group)) empty[key] = '';
        return empty;
    }
</script>

{#if $edition}
    <Page title={`${$edition?.getTitle()} - Theme`}>
        <Header
            editable={isEditionEditable()}
            label="Theme"
            id="theme"
            getImage={() => null}
            setImage={() => undefined}
            header="Theme"
        >
            <Outline slot="outline" previous={null} next={null} />
        </Header>

        <Instructions {editable}>
            This is the theme editor. You can use it to choose from existing
            themes or create a custom theme for your book's appearance. To use
            it, you'll need to know a bit about how to format CSS <Link
                to="https://developer.mozilla.org/en-US/docs/Web/CSS/color"
                >colors</Link
            >, <Link
                to="https://developer.mozilla.org/en-US/docs/Web/CSS/font-size"
                >fonts</Link
            >, and <Link
                to="https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Values_and_units"
                >sizes</Link
            >.
        </Instructions>

        <Switch
            options={Object.keys(themes)}
            edit={(name) =>
                $edition
                    ? edition.set($edition.withTheme(themes[name]))
                    : undefined}
            value={Object.keys(themes).find((key) => themes[key] === theme) ??
                ''}
        />

        <!-- If it's not one of the  -->
        {#if isDefault}
            <Button
                tooltip="customize theme"
                command={() =>
                    $edition
                        ? edition.set(
                              $edition.withTheme({
                                  ...(theme === null ? BookishTheme : theme),
                              })
                          )
                        : undefined}>customize</Button
            >
        {:else}
            <ConfirmButton
                tooltip="change theme to the default"
                commandLabel="- theme"
                confirmLabel="delete your theme?"
                command={() =>
                    $edition
                        ? edition.set($edition.withTheme(null))
                        : undefined}
            />
        {/if}

        <ThemeEditorPreview {theme} />

        {#if !isDefault && theme !== null}
            <ThemeSetEditor
                header={'Light mode colors'}
                group="light"
                properties={theme.light ?? getEmptyGroup(BookishTheme.light)}
            />
            <ThemeSetEditor
                header={'Dark mode colors'}
                group="dark"
                properties={theme.dark ?? getEmptyGroup(BookishTheme.dark)}
            />
            <ThemeSetEditor
                header={'Fonts'}
                group="fonts"
                properties={theme.fonts ?? getEmptyGroup(BookishTheme.fonts)}
            />
            <ThemeSetEditor
                header={'Font sizes'}
                group="sizes"
                properties={theme.sizes ?? getEmptyGroup(BookishTheme.sizes)}
            />
            <ThemeSetEditor
                header={'Font weights'}
                group="weights"
                properties={theme.weights ??
                    getEmptyGroup(BookishTheme.weights)}
            />
            <ThemeSetEditor
                header={'Spacing'}
                group="spacing"
                properties={theme.spacing ??
                    getEmptyGroup(BookishTheme.spacing)}
            />

            <Rows>
                <tr>
                    <td>
                        <em
                            >Add URLs to your own CSS to customize fonts and
                            styles further.</em
                        >
                    </td>
                    <td style="text-align:right;">
                        <Button
                            tooltip="add CSS URL import"
                            command={() => {
                                if (theme === null) return;
                                if (theme.imports === undefined)
                                    theme.imports = [];
                                theme.imports.push('');
                                if ($edition)
                                    edition.set($edition.withTheme(theme));
                            }}>+</Button
                        >
                    </td>
                </tr>
                {#each theme.imports ?? [] as url, index}
                    <tr>
                        <td>
                            <TextEditor
                                text={url}
                                label={`CSS url`}
                                placeholder={'CSS url'}
                                valid={() => undefined}
                                save={(text) => {
                                    const newTheme = { ...theme };
                                    if (newTheme.imports === undefined)
                                        newTheme.imports = [];
                                    newTheme.imports[index] = text;
                                    if ($edition)
                                        edition.set($edition.withTheme(theme));
                                }}
                            />
                        </td>
                        <td style="text-align: right">
                            <Button
                                tooltip="Remove CSS URL import"
                                command={() => {
                                    theme?.imports?.splice(index, 1);
                                    if ($edition)
                                        edition.set($edition.withTheme(theme));
                                }}>–</Button
                            >
                        </td>
                    </tr>
                {/each}
            </Rows>
        {/if}
    </Page>
{/if}
