<script lang="ts">
    enum Status {
        Viewing,
        Editing
    }

    export let startText: string;
    export let label: string;
    export let placeholder: string;
    export let valid: (text: string) => string | undefined;
    export let save: (text: string) => Promise<void> | undefined | void | string;
    export let saveOnExit: boolean = false;
    export let width: number | undefined = undefined;
    export let clip: boolean = false;

    let text = startText;
    let status = Status.Viewing;
    let error: undefined | string = valid(text);
    let field:  HTMLInputElement | null = null;
    let sizer: HTMLSpanElement | null = null;

    // Grow the sizer when text or status changes.
    $: {
        if(sizer) {
            // Set the invisible sizer to the text to set the container's width.
            // The browser strips trailing spaces, causing jitter after a space, so we replace
            // them with non-breaking spaces.
            const sizedText = showPlaceholder() ? placeholder : text.replace(/\s/g, "\u00a0");
            // Clip the text to prevent this editor from getting too long when editing or when asked to.. If it goes past one line,
            // the measurements and layout are way off.
            const trimmedText = width !== undefined && (clip === true || status === Status.Editing) ? sizedText.substring(0, width) + "…" : sizedText;
            sizer.innerHTML = trimmedText;
        }
    }

    // When status changes, focus or blur.
    $: {
        if(field) {
            if(status === Status.Editing) {
                field.focus();
            }
            else {
                field.blur();
            }
        }
    }

    // When text changes, save, unless we only save on exit.
    $: {
        if(!saveOnExit)
            saveText(text);
    }

    function showPlaceholder() {
        return text === "";
    }

    function startEditing() {
        status = Status.Editing;
    }

    function stopEditing() {
        status = Status.Viewing;
        if(saveOnExit)
            saveText(text)
    }

    function edit() {
        if(field) {
            text = field.value;
            if(saveOnExit === false)
                saveText(text);
        }
    }

    function saveText(newText: string) {
        if(validate(newText) === undefined) {
            const revisedText = save(newText);
            if(typeof revisedText === "string") {
                text = revisedText;
            }
            if(revisedText instanceof Promise)
                revisedText.catch((err: Error) => error = err.message)
        }
    }

    function validate(value: string): string | undefined {
        return valid(value);
    }

    function handleKeyPress(event: KeyboardEvent) {
        if(event.key === "Enter")
            status = Status.Viewing;
    }

</script>

<span class={`bookish-text-editor ${showPlaceholder() ? "bookish-text-editor-placeholder" : ""} ${status === Status.Viewing ? "bookish-text-editor-viewing" : ""}`}>
    <span class="bookish-text-editor-sizer" aria-hidden={true} bind:this={sizer} on:click={startEditing}></span>
    <input
        type="text" 
        bind:this={field}
        bind:value={text}
        required
        role="textbox"
        aria-invalid={error !== undefined}
        aria-label={label}
        placeholder={placeholder}
        on:change={edit}
        on:keypress={handleKeyPress}
        on:blur={stopEditing}
        on:focus={startEditing}
    />
    {#if error }
        <span
            aria-live="polite"
            class={`bookish-text-editor-error ${status === Status.Editing ? "bookish-text-editor-error-focused" : ""}`}
        >
            {status === Status.Viewing ? "\u2715" : error}
        </span>
    {/if}
</span>

<style>
    .bookish-text-editor {
        position: relative;
    }

    .bookish-text-editor input[type="text"] {
        cursor: pointer;
        position: absolute;
        left: 0;
        margin-top: -2px; /* Matches the outline offset */
        width: 100%;
        min-width: 0.5em;
    }

    /* Match the parent's styling as much as possible. */
    .bookish-text-editor input[type="text"], .bookish-text-editor-sizer {
        background-color: inherit;
        font-family: inherit;
        font-size: inherit;
        font-weight: inherit;
        font-style: inherit;
        line-height: inherit;
        color: inherit;
        border: none;
        box-sizing: content-box;
        padding: 0;
        margin: 0;
        display: inline;
        cursor: text;
    }

    /* This ensures the error message always appears below empty text editors */
    .bookish-text-editor-sizer {
        min-height: 1em;
        opacity: 0;
    }

    .bookish-text-editor-viewing .bookish-text-editor-sizer {
        opacity: 1;
    }

    /* This ensures that the sizer doesn't end up with zero width and height. */
    .bookish-text-editor-sizer:empty:before {
        content: "\200b";
    }

    /* Override the inherited color of the text is a placeholder */
    .bookish-text-editor-placeholder .bookish-text-editor-sizer {
        color: var(--bookish-app-chrome-muted);
    }

    /* Hide the text field when its being viewed so we can let the sizer display the full value, in case it's long. */
    .bookish-text-editor.bookish-text-editor-viewing input {
        opacity: 0;
    }

    .bookish-text-editor .bookish-text-editor-error {
        position: absolute;
        left: 0;
        top: 100%;
        width: max-content;
        z-index: 3;
        line-height: 1em;
        margin-left: -0.5em;
        padding: 0.5em 0.5em;
    }

    .bookish-text-editor .bookish-text-editor-error.bookish-text-editor-error-focused {
        /* Put this above other errors nearby. */
        z-index: 4;
    }

    .bookish-editor-error, .bookish-text-editor-error {
        font-family: var(--bookish-app-chrome-font-family);
        font-size: var(--bookish-small-font-size);
        font-weight: normal;
        font-style: normal;
        color: var(--bookish-app-error-color);
        background: var(--bookish-background-color);
        animation: failure 100ms 10;
    }

</style>