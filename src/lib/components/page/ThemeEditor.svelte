<script lang="ts">
    import Header from "./Header.svelte";
    import Outline from './Outline.svelte';
    import Page from './Page.svelte';
    import { BookishTheme, CriticalTheme, HumanTheme, SeriousTheme, SketchyTheme, TechTheme } from '$lib/models/book/Theme'
    import ConfirmButton from '$lib/components/editor/ConfirmButton.svelte'
    import Instructions from './Instructions.svelte'
    import ThemeSetEditor from './ThemeSetEditor.svelte'
    import ThemeEditorPreview from './ThemeEditorPreview.svelte'
    import External from "../External.svelte";
    import { getEdition } from "./Contexts";
    import TextEditor from "../editor/TextEditor.svelte";
    import type Theme from "$lib/models/book/Theme";
    import Button from "../app/Button.svelte";
    import Switch from "../editor/Switch.svelte";

    const themes: Record<string,Theme> = {
        Bookish: BookishTheme,
        Serious: SeriousTheme,
        Tech: TechTheme,
        Human: HumanTheme,
        Sketchy: SketchyTheme,
        Critical: CriticalTheme,
    };

    let edition = getEdition();
    $: theme = $edition.getTheme();
    $: isDefault = theme === null || Object.values(themes).includes(theme);

    function getEmptyGroup(group: Record<string,string>) {
        const empty: Record<string, string> = {};
        for(const key in Object.keys(group))
            empty[key] = "";
        return empty;
    }

</script>

<Page title={`${$edition.getTitle()} - Theme`}>
    <Header 
        label="Theme"
        getImage={() => null}
        setImage={ () => undefined}
        header="Theme"
    >
        <Outline
            slot="outline"
            previous={null}
            next={null}
        />
    </Header>

    <Instructions>
        This is the theme editor. 
        You can use it to choose from existing themes or create a custom theme for your book's appearance.
        To use it, you'll need to know a bit about how to format CSS <External to="https://developer.mozilla.org/en-US/docs/Web/CSS/color">colors</External>, <External to="https://developer.mozilla.org/en-US/docs/Web/CSS/font-size">fonts</External>, and <External to="https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Values_and_units">sizes</External>.
    </Instructions>


    <Switch
        options={Object.keys(themes)} 
        edit={name => $edition.setTheme(themes[name])}
        value={Object.keys(themes).find(key => themes[key] === theme) ?? ""}
    />

    <!-- If it's not one of the  -->
    {#if isDefault }
        <Button tooltip="Create a custom theme" command={() => $edition.setTheme({ ...(theme === null ? BookishTheme : theme ) })}>Customize</Button>
    {:else}
        <ConfirmButton
            tooltip="Change the theme to the default Bookish theme."
            commandLabel="Revert to default"
            confirmLabel="Delete your theme?"
            command={() => $edition.setTheme(null)}
        />
    {/if}

    <ThemeEditorPreview theme={theme}/>

    {#if !isDefault && theme !== null}
        <ThemeSetEditor header={"Light mode colors"} group="light" properties={theme.light ?? getEmptyGroup(BookishTheme.light)} />
        <ThemeSetEditor header={"Dark mode colors"} group="dark" properties={theme.dark ?? getEmptyGroup(BookishTheme.dark)} />
        <ThemeSetEditor header={"Fonts"} group="fonts" properties={theme.fonts ?? getEmptyGroup(BookishTheme.fonts)} />
        <ThemeSetEditor header={"Font sizes"} group="sizes" properties={theme.sizes ?? getEmptyGroup(BookishTheme.sizes)} />
        <ThemeSetEditor header={"Font weights"} group="weights" properties={theme.weights ?? getEmptyGroup(BookishTheme.weights)} />
        <ThemeSetEditor header={"Spacing"} group="spacing" properties={theme.spacing ?? getEmptyGroup(BookishTheme.spacing)} />

        <div class="bookish-table">
            <table >
                <tbody>
                    <tr>
                        <td>
                            <em>Add URLs to your own CSS to customize fonts and styles further.</em>
                        </td>
                        <td style='text-align:right;'>
                            <Button tooltip="Add a CSS import" command={() => {
                                if(theme === null) return;
                                if(theme.imports === undefined)
                                    theme.imports = [];
                                theme.imports.push("");
                                $edition.setTheme(theme);
                            }}>+</Button>
                        </td>
                    </tr>
                    {#each theme.imports ?? [] as url, index}
                        <tr>
                            <td>
                                <TextEditor 
                                    startText={url} 
                                    label={`CSS url`}
                                    placeholder={"CSS url"}
                                    valid={ () => undefined }
                                    save={text => {
                                        const newTheme = { ... theme };
                                        if(newTheme.imports === undefined) newTheme.imports = [];
                                        newTheme.imports[index] = text;
                                        $edition.setTheme(theme);
                                    }}
                                />
                            </td>
                            <td style="text-align: right">
                                <Button tooltip="Remove this CSS import" command={() => {
                                    theme?.imports?.splice(index, 1);
                                    $edition.setTheme(theme);
                                }}>–</Button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}

</Page>