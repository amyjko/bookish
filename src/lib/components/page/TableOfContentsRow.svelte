<script lang="ts">
    import TableOfContentsImage from './TableOfContentsImage.svelte';
    import type Chapter from '$lib/models/book/Chapter';
    import Toggle from '$lib/components/editor/Toggle.svelte';
    import ConfirmButton from '$lib/components/editor/ConfirmButton.svelte';
    import { getBase, getEdition, isEditable } from './Contexts';
    import Muted from './Muted.svelte';
    import ChapterNumber from './ChapterNumber.svelte';
    import Button from '../app/Button.svelte';
    import ChapterTitle from './ChapterTitle.svelte';

    export let chapterID: string;
    export let chapter: Chapter | undefined = undefined;
    export let title: string;
    export let number: number | undefined = undefined;
    export let forthcoming: boolean = false;

    let edition = getEdition();
    let base = getBase();
    let editable = isEditable();

    function moveUp() {
        chapter?.move(-1);
    }
    function moveDown() {
        chapter?.move(1);
    }
</script>

<tr class={forthcoming ? 'bookish-forthcoming' : ''}>
    <td
        ><TableOfContentsImage
            embed={chapter ? chapter.getImage() : $edition.getImage(chapterID)}
        /></td
    >
    <td>
        <div>
            {#if editable && chapter}
                <Toggle
                    on={number !== undefined}
                    save={(on) => chapter && chapter.setNumbered(on)}
                >
                    <ChapterNumber>
                        {#if number !== undefined}
                            Chapter {number}
                        {:else}
                            <Muted>Unnumbered</Muted>
                        {/if}
                    </ChapterNumber>
                </Toggle>
            {:else if number !== undefined}
                <ChapterNumber>{'Chapter ' + number}</ChapterNumber>
            {/if}
        </div>
        <ChapterTitle
            link={forthcoming && !editable ? undefined : `${base}${chapterID}`}
            >{title}</ChapterTitle
        >
        <div><Muted><em><slot name="annotation" /></em></Muted></div>
    </td>
    <td><slot name="etc" /></td>
    {#if editable}
        <td>
            {#if chapter}
                <Button
                    tooltip="Move chapter up"
                    disabled={chapter.getPosition() === 0}
                    command={moveUp}>{'↑'}</Button
                >
                &nbsp;
                <Button
                    tooltip="Move chapter down"
                    disabled={chapter.getPosition() ===
                        chapter.getBook().getChapterCount() - 1}
                    command={moveDown}>{'↓'}</Button
                >
                &nbsp;
                <ConfirmButton
                    tooltip="Delete this chapter"
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
