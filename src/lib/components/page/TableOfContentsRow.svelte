<script lang="ts">
    import Link from "$lib/components/Link.svelte";
    import TableOfContentsImage from "./TableOfContentsImage.svelte";
    import type Chapter from "$lib/models/book/Chapter";
    import Toggle from "$lib/components/editor/Toggle.svelte";
    import ConfirmButton from "$lib/components/editor/ConfirmButton.svelte";
    import { getBase, getEdition, isEditable } from "./Contexts";
    import Muted from "./Muted.svelte";
    import ChapterNumber from "./ChapterNumber.svelte";

    export let chapterID: string;
    export let chapter: Chapter | undefined = undefined;
    export let title: string;
    export let number: number | undefined = undefined;
    export let forthcoming: boolean = false;

    let edition = getEdition();
    let base = getBase();
	let editable = isEditable();

	function moveUp() { chapter?.move(-1) }
	function moveDown() { chapter?.move(1) }

</script>

<tr class={forthcoming ? "bookish-forthcoming" : ""}>
    <td><TableOfContentsImage embed={chapter ? chapter.getImage() : $edition.getImage(chapterID)} /></td>
    <td>
        {#if editable && chapter}
            <Toggle on={number !== undefined} save={ on => chapter && chapter.setNumbered(on) }>
                <div>
                    <ChapterNumber>
                        {#if number !== undefined}
                            Chapter {number}
                        {:else}
                            <Muted>Unnumbered</Muted>
                        {/if}
                    </ChapterNumber>
                </div>
            </Toggle>
        {:else if number !== undefined }
            <div><ChapterNumber>{"Chapter " + number}</ChapterNumber></div>
        {/if}
        {#if forthcoming && !editable}
            <span>{title}</span>
        {:else}
            <Link to={`${base}/${chapterID}`}>{title}</Link>
        {/if}
        <div><Muted><em><slot name="annotation"></slot></em></Muted></div>
    </td>
    <td><slot name="etc"></slot></td>
    {#if editable }
        <td>
            {#if chapter }
                <button disabled={chapter.getPosition() === 0} on:click={moveUp}>{"↑"}</button>
                &nbsp;
                <button disabled={chapter.getPosition() === chapter.getBook().getChapterCount() - 1} on:click={moveDown}>{"↓"}</button>
                &nbsp;
                <ConfirmButton
                    commandLabel="x"
                    confirmLabel="Confirm"
                    command={() => chapter && chapter.delete()}
                />
            {/if}
        </td>
    {/if}
</tr>

<style>
    .bookish-forthcoming {
        opacity: 0.5;
    }
</style>