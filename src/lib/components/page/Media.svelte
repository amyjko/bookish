<script lang="ts">
    import Header from '$lib/components/page/Header.svelte';
    import Outline from '$lib/components/page/Outline.svelte';
    import type { Image } from '$lib/models/book/BookMedia';
    import Page from '$lib/components/page/Page.svelte';
    import Instructions from '$lib/components/page/Instructions.svelte';
    import ChapterIDs from '$lib/models/book/ChapterID';
    import Format from '$lib/components/chapter/Format.svelte';
    import MediaPreview from './MediaPreview.svelte';
    import { onMount } from 'svelte';
    import {
        getBase,
        getBook,
        getEdition,
        isBookEditable,
        isEditionEditable,
    } from './Contexts';
    import PageHeader from './PageHeader.svelte';
    import ConfirmButton from '../editor/ConfirmButton.svelte';

    let book = getBook();
    let edition = getEdition();
    let editable = isBookEditable();
    let base = getBase();

    let images: Image[] | undefined = [];

    $: embeds = $edition?.getEmbeds() ?? [];
    $: media = $book?.getMedia();

    function updateImages(newImages: Image[] | undefined) {
        images = newImages;
    }

    onMount(() => {
        // Listen to image changes.
        media?.notify(updateImages);
        return () => media?.stopNotifying(updateImages);
    });

    $: unused = images?.filter(
        (image) =>
            !embeds.some((embed) => image.url.includes(embed.embed.getURL()))
    );
</script>

{#if $edition}
    <Page title={`${$edition.getTitle()} - Media`}>
        <Header
            editable={isEditionEditable()}
            label="Media title"
            id="media"
            getImage={() => $edition?.getImage(ChapterIDs.MediaID) ?? null}
            setImage={(embed) =>
                $edition
                    ? edition.set($edition.withImage(ChapterIDs.MediaID, embed))
                    : undefined}
            header="Media"
            tags={$edition.getTags()}
        >
            <Outline
                slot="outline"
                previous={$edition.getPreviousChapterID(ChapterIDs.MediaID)}
                next={$edition.getNextChapterID(ChapterIDs.MediaID)}
            />
        </Header>
        <Instructions {editable}>
            These are the images in the book, in order of appearance. You can
            use this page to manage any images that are linked or uploaded for
            this book. Note: images are shared between all editions, so if you
            delete one not used in this edition, it might be used in others.
        </Instructions>

        {#if embeds.length === 0}
            <p>No images or videos appear in the book.</p>
        {:else}
            <p>These are the images in the book:</p>
        {/if}
        {#each embeds as { embed, chapterID }}
            {#if !embed.isVideo()}
                <MediaPreview
                    {chapterID}
                    url={embed.isLocal()
                        ? `${$base}/${embed.getSmallURL()}`
                        : embed.getSmallURL()}
                    alt={embed.getDescription() === ''
                        ? 'no description'
                        : embed.getDescription()}
                >
                    {#if editable}{images &&
                        images.find((i) => i.url === embed.getURL()) ===
                            undefined
                            ? embed.getURL().length === 0
                                ? 'no url'
                                : 'linked'
                            : 'uploaded'}{embed.getCredit().isEmptyText()
                            ? ''
                            : ' • '}{/if}<Format node={embed.getCredit()} />
                </MediaPreview>
            {/if}
        {/each}
        {#if editable && unused !== undefined && unused.length > 0}
            <PageHeader id="unused">Unused</PageHeader>
            <Instructions {editable}>
                These images are uploaded for this book, but not used in this
                edition. Delete them if you don't need them. Warning: images may
                be used in other editions of this book.
            </Instructions>
            {#each unused as image}
                <MediaPreview chapterID={undefined} url={image.url} alt={''}>
                    <ConfirmButton
                        tooltip="delete unused image"
                        confirm="delete image?"
                        command={() =>
                            media
                                ?.remove(image)
                                .then((images) => updateImages(images))}
                        >⨉ image</ConfirmButton
                    >
                </MediaPreview>
            {/each}
        {/if}
    </Page>
{/if}
