<script lang="ts">
    import Link from "$lib/components/Link.svelte";
    import TableOfContentsImage from "./TableOfContentsImage.svelte";
    import type Chapter from "$lib/models/book/Chapter";
    import Toggle from "$lib/components/editor/Toggle.svelte";
    import ConfirmButton from "$lib/components/editor/ConfirmButton.svelte";
    import { getBase, getEdition, isEditable } from "./Contexts";

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
    <td><TableOfContentsImage embed={$edition.getImage(chapterID)} /></td>
    <td>
        {#if editable && chapter}
            <Toggle on={number !== undefined} save={ on => chapter && chapter.setNumbered(on) }>
                <div class="bookish-chapter-number">
                    {#if number !== undefined}
                        Chapter {number}
                    {:else}
                        <span class="bookish-muted">Unnumbered</span>
                    {/if}
                </div>
            </Toggle>
        {:else if number !== undefined }
            <div class="bookish-chapter-number">{"Chapter " + number}</div>
        {/if}
        {#if forthcoming && !editable}
            <span>{title}</span>
        {:else}
            <Link to={base + "/chapter/" + chapterID}>{title}</Link>
        {/if}
        <small class="bookish-muted"><br/><em><slot name="annotation"></slot></em></small>
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