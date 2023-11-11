<script lang="ts">
    import TableOfContentsImage from './TableOfContentsImage.svelte';
    import type Chapter from '$lib/models/book/Chapter';
    import Toggle from '$lib/components/editor/Toggle.svelte';
    import ConfirmButton from '$lib/components/editor/ConfirmButton.svelte';
    import {
        getBase,
        getEdition,
        isEditionEditable,
        setChapter,
    } from './Contexts';
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
    let editable = isEditionEditable();

    function moveUp() {
        if ($edition && chapter)
            edition.set($edition.withMovedChapter(chapter.getID(), -1));
    }
    function moveDown() {
        if ($edition && chapter)
            edition.set($edition.withMovedChapter(chapter.getID(), 1));
    }

    $: chapterURL =
        forthcoming && !editable ? undefined : `${$base}/${chapterID}`;
</script>

<tr class="toc-row" class:forthcoming>
    <td
        ><TableOfContentsImage
            embed={chapter
                ? chapter.getImage()
                : $edition?.getImage(chapterID) ?? null}
            url={chapterURL}
        /></td
    >
    <td>
        {#if editable && chapter}
            <Toggle
                on={number !== undefined}
                save={(on) =>
                    chapter
                        ? setChapter(edition, chapter, chapter.asNumbered(on))
                        : undefined}
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
        <ChapterTitle link={chapterURL}>{title}</ChapterTitle>
        <p><Muted><em><slot name="annotation" /></em></Muted></p>
    </td>
    <td><slot name="etc" /></td>
    {#if editable && $edition}
        <td class="controls">
            {#if chapter}
                <Button
                    tooltip="move chapter {title} up"
                    disabled={$edition.getChapterPosition(chapter.getID()) ===
                        0}
                    command={moveUp}>{'↑'}</Button
                >
                <Button
                    tooltip="move chapter {title} down"
                    disabled={$edition.getChapterPosition(chapter.getID()) ===
                        $edition.getChapterCount() - 1}
                    command={moveDown}>{'↓'}</Button
                >
                <ConfirmButton
                    tooltip="delete chapter {title}"
                    confirm="delete"
                    command={() =>
                        chapter && $edition
                            ? edition.set(
                                  $edition.withoutChapter(chapter.getID())
                              )
                            : undefined}>⨉</ConfirmButton
                >
            {/if}
        </td>
    {/if}
</tr>

<style>
    .toc-row p {
        margin: 0;
    }

    .forthcoming {
        color: var(--app-muted-color);
    }

    .controls {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        justify-content: end;
        margin-inline-end: var(--app-chrome-padding);
        gap: var(--app-chrome-padding);
    }

    td:first-child {
        padding-left: 0;
    }

    td:last-child {
        padding-right: 0;
    }

    td {
        vertical-align: top;
    }
</style>
