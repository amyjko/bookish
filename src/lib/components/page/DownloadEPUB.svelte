<script lang="ts">
    import { onDestroy } from 'svelte';
    import { getBase, getEdition } from './Contexts';
    import { buildEPUB, type BuildProgress } from '$lib/epub/build';
    import { DEFAULT_SIZE, SIZES } from '$lib/epub/images';

    let edition = getEdition();
    let base = getBase();

    let sizeID = $state(DEFAULT_SIZE.id);
    let grayscale = $state(false);
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

    /**
     * Any change to the controls makes an already-built file stale: without
     * this the reader could flip a setting and download something that doesn't
     * match what the controls say.
     */
    function invalidate() {
        release();
        warnings = [];
        error = undefined;
    }

    function chooseSize(id: string) {
        sizeID = id;
        invalidate();
    }

    function chooseGrayscale(on: boolean) {
        grayscale = on;
        invalidate();
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
                grayscale,
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
            <!-- The wrapper carries the disclosure arrow: turning off native
                 appearance to get the book's font also removes the browser's. -->
            <span class="select">
                <select
                    value={sizeID}
                    disabled={building}
                    onchange={(event) => chooseSize(event.currentTarget.value)}
                >
                    {#each Object.values(SIZES) as size}
                        <option value={size.id}>{size.label}</option>
                    {/each}
                </select>
            </span>
        </label>
        <label class="greyscale">
            <input
                type="checkbox"
                checked={grayscale}
                disabled={building}
                onchange={(event) =>
                    chooseGrayscale(event.currentTarget.checked)}
            />
            Greyscale
            <span class="note"
                >(a little smaller; e-readers convert anyway)</span
            >
        </label>
        <!-- A plain button rather than the app's, whose --app-* variables are
             only defined in the (app) layout, so it renders unstyled here and
             in books compiled by bookish-reader. -->
        <button
            type="button"
            title="Build an EPUB of this book to read on an e-reader"
            aria-label="Build an EPUB of this book to read on an e-reader"
            disabled={building}
            onclick={build}>↓ EPUB</button
        >
    </div>

    {#if error}
        <p class="message error" role="alert">{error}</p>
    {:else if status}
        <p class="message" role="status" aria-live="polite">{status}</p>
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
    /* Everything here is drawn with the book's own --bookish-* variables, which
       are defined on the .bookish ancestor in Edition.svelte and so are in
       scope in both the app and in books compiled by bookish-reader. The
       --app-* chrome variables are not: they exist only in the (app) layout. */

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
        gap: 0.5em;
        font-family: var(--bookish-paragraph-font-family);
        font-size: var(--bookish-small-font-size);
        color: var(--bookish-muted-color);
    }

    .select {
        position: relative;
        display: inline-block;
    }

    /* The disclosure arrow, in place of the native one. It inherits the text
       color, so it follows the theme into dark mode. */
    .select::after {
        content: '▾';
        position: absolute;
        right: 0.6em;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        font-size: 0.9em;
        color: var(--bookish-paragraph-color);
    }

    /* A <select> is a native menulist, and WebKit renders its face in the
       system font whatever the cascade says until appearance is turned off. */
    select {
        appearance: none;
        -webkit-appearance: none;
        font-family: var(--bookish-paragraph-font-family);
        font-size: var(--bookish-small-font-size);
        font-weight: var(--bookish-paragraph-font-weight);
        color: var(--bookish-paragraph-color);
        background: var(--bookish-block-background-color);
        border: 1px solid var(--bookish-border-color-light);
        border-radius: var(--bookish-roundedness);
        padding: var(--bookish-inline-padding);
        padding-right: 2em;
        max-width: 18em;
    }

    button {
        font-family: var(--bookish-paragraph-font-family);
        font-size: var(--bookish-small-font-size);
        font-weight: var(--bookish-bold-font-weight);
        color: var(--bookish-link-color);
        background: var(--bookish-block-background-color);
        border: 1px solid var(--bookish-border-color-light);
        border-radius: var(--bookish-roundedness);
        padding: var(--bookish-inline-padding)
            calc(var(--bookish-inline-padding) * 3);
        cursor: pointer;
    }

    button:hover:not(:disabled) {
        border-color: var(--bookish-highlight-color);
    }

    /* focus-visible, so a mouse click doesn't leave the ring behind while
       keyboard users still get one. */
    select:focus-visible,
    button:focus-visible {
        outline: none;
        border-color: var(--bookish-highlight-color);
        box-shadow: 0 0 0 2px var(--bookish-highlight-color);
    }

    select:disabled,
    button:disabled {
        opacity: 0.5;
        cursor: auto;
    }

    .message,
    .ready,
    .warnings {
        font-family: var(--bookish-paragraph-font-family);
        line-height: var(--bookish-paragraph-line-height);
    }

    .message {
        color: var(--bookish-muted-color);
    }

    .error {
        color: var(--bookish-error-color);
    }

    /* Matches a book link, from components/Link.svelte. */
    .ready a {
        color: var(--bookish-link-color);
        font-weight: var(--bookish-link-font-weight);
        text-decoration: none;
    }

    .ready a:hover {
        text-decoration: underline;
    }

    .greyscale {
        gap: 0.35em;
    }

    .greyscale .note {
        color: var(--bookish-muted-color);
    }

    .warnings {
        font-size: var(--bookish-small-font-size);
        font-style: italic;
        color: var(--bookish-muted-color);
    }
</style>
