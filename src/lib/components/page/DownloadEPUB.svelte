<script lang="ts">
    import { onDestroy } from 'svelte';
    import { getBase, getEdition } from './Contexts';
    import { buildEPUB, type BuildProgress } from '$lib/epub/build';
    import { DEFAULT_SIZE, SIZES } from '$lib/epub/images';
    import Feedback from '../app/Feedback.svelte';
    import Button from '../app/Button.svelte';

    let edition = getEdition();
    let base = getBase();

    let sizeID = $state(DEFAULT_SIZE.id);
    let building = $state(false);
    let progress: BuildProgress | undefined = $state(undefined);
    let error: string | undefined = $state(undefined);
    let warnings: string[] = $state([]);
    let url: string | undefined = $state(undefined);
    let filename = $state('book.epub');

    /** Release the previous blob before replacing or discarding it. */
    function release() {
        if (url !== undefined) {
            URL.revokeObjectURL(url);
            url = undefined;
        }
    }

    /** A previous build is stale once the reader asks for a different size. */
    function chooseSize(id: string) {
        sizeID = id;
        release();
        warnings = [];
        error = undefined;
    }

    async function build() {
        if ($edition === undefined || building) return;

        building = true;
        release();
        error = undefined;
        warnings = [];
        progress = { phase: 'images', done: 0, total: 0 };

        try {
            // Everything below runs only on a click, so the browser-only APIs
            // it reaches are never touched while server rendering.
            const result = await buildEPUB($edition, {
                base: $base ?? '',
                size: SIZES[sizeID] ?? DEFAULT_SIZE,
                onProgress: (update) => (progress = update),
            });
            url = URL.createObjectURL(result.blob);
            filename = result.filename;
            warnings = result.warnings;
        } catch (problem) {
            console.error(problem);
            error = 'Something went wrong building the e-book.';
        } finally {
            building = false;
            progress = undefined;
        }
    }

    // $derived.by rather than $derived: svelte2tsx mis-narrows the type of a
    // value read inside a multiline $derived expression.
    let status: string | undefined = $derived.by(() => {
        if (progress === undefined) return undefined;
        if (progress.phase === 'images')
            return progress.total === 0
                ? 'Gathering images…'
                : `Shrinking image ${progress.done} of ${progress.total}…`;
        if (progress.phase === 'chapters')
            return `Preparing chapter ${progress.done} of ${progress.total}…`;
        return 'Packaging the book…';
    });

    onDestroy(release);
</script>

{#if $edition}
    <div class="epub">
        <label>
            Image size
            <select
                value={sizeID}
                disabled={building}
                onchange={(event) => chooseSize(event.currentTarget.value)}
            >
                {#each Object.values(SIZES) as size}
                    <option value={size.id}>{size.label}</option>
                {/each}
            </select>
        </label>
        <Button
            tooltip="Build an EPUB of this book to read on an e-reader"
            disabled={building}
            command={build}>↓ EPUB</Button
        >
    </div>

    {#if error}
        <Feedback error>{error}</Feedback>
    {:else if status}
        <Feedback>{status}</Feedback>
    {:else if url}
        <!-- Rendered only once the blob exists, so this link is never present
             in prerendered HTML for SvelteKit's crawler to follow. -->
        <p class="ready">
            <a href={url} download={filename}>Download {filename}</a>
        </p>
        {#if warnings.length > 0}
            <p class="warnings">
                {warnings.length}
                {warnings.length === 1 ? 'image' : 'images'} couldn't be included,
                usually because they're hosted somewhere that doesn't allow downloads.
                Their captions are still in the book.
            </p>
        {/if}
    {/if}
{/if}

<style>
    .epub {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5em;
        margin-block: var(--bookish-paragraph-spacing);
    }

    label {
        display: inline-flex;
        align-items: center;
        gap: 0.25em;
        font-family: var(--bookish-paragraph-font-family);
        font-size: var(--bookish-small-font-size);
    }

    /* Styled without the --app-* variables, which aren't defined in books
       compiled by bookish-reader. */
    select {
        font: inherit;
        padding: 0.2em;
        max-width: 16em;
    }

    .ready {
        font-family: var(--bookish-paragraph-font-family);
    }

    .warnings {
        font-family: var(--bookish-paragraph-font-family);
        font-size: var(--bookish-small-font-size);
        font-style: italic;
    }
</style>
