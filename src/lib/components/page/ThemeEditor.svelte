<script lang="ts">
    import Header from "./Header.svelte";
    import Outline from './Outline.svelte';
    import Page from './Page.svelte';
    import { defaultTheme } from '$lib/models/book/Theme'
    import ConfirmButton from '$lib/components/editor/ConfirmButton.svelte'
    import Instructions from './Instructions.svelte'
    import ThemeSetEditor from './ThemeSetEditor.svelte'
    import ThemeEditorPreview from './ThemeEditorPreview.svelte'
    import External from "../External.svelte";
    import { getEdition } from "./Contexts";

    let edition = getEdition();
    $: theme = $edition.getTheme();

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

    {#if theme === null }
        <button on:click={() => $edition.setTheme(defaultTheme)}>Customize</button>
    {:else}
        <ConfirmButton
            commandLabel="Revert to default"
            confirmLabel="Delete your theme?"
            command={() => $edition.setTheme(null)}
        />
        <ThemeEditorPreview theme={theme}/>
        <ThemeSetEditor header={"Light mode colors"} group="light" theme={theme} />
        <ThemeSetEditor header={"Dark mode colors"} group="dark" theme={theme} />
        <ThemeSetEditor header={"Fonts"} group="fonts" theme={theme} />
        <ThemeSetEditor header={"Font sizes"} group="sizes" theme={theme} />
        <ThemeSetEditor header={"Font weights"} group="weights" theme={theme} />
        <ThemeSetEditor header={"Spacing"} group="spacing" theme={theme} />
    {/if}

</Page>