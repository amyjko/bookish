<script lang="ts">
    enum Status {
        Viewing,
        Editing,
    }

    interface Props {
        text: string;
        label: string;
        placeholder: string;
        valid: (text: string) => string | undefined;
        save: (
        text: string,
    ) => Promise<void> | undefined | void | string;
        saveOnExit?: boolean;
        width?: number | undefined;
        clip?: boolean;
        move?: 
        | ((el: HTMLElement, direction: -1 | 1) => void)
        | undefined;
    }

    let {
        text = $bindable(),
        label,
        placeholder,
        valid,
        save,
        saveOnExit = false,
        width = undefined,
        clip = false,
        move = undefined
    }: Props = $props();

    let status = $state(Status.Viewing);
    let field: HTMLInputElement | null = $state(null);
    let sizer: HTMLSpanElement | null = $state(null);





    function showPlaceholder() {
        return text === '';
    }

    function startEditing() {
        status = Status.Editing;
    }

    function stopEditing() {
        status = Status.Viewing;
        if (saveOnExit) saveText(text);
    }

    function edit() {
        if (field) {
            text = field.value;
            if (saveOnExit === false) saveText(text);
        }
    }

    function saveText(newText: string) {
        if (validate(newText) === undefined) {
            const revisedText = save(newText);
            if (typeof revisedText === 'string') {
                text = revisedText;
            }
            if (revisedText instanceof Promise)
                revisedText.catch((err: Error) => (error = err.message));
        }
    }

    function validate(value: string): string | undefined {
        return valid(value);
    }

    function handleKeyPress(event: KeyboardEvent) {
        if (event.key === 'Enter') status = Status.Viewing;
        else if (event.key === 'ArrowUp' && move && field) {
            event.preventDefault();
            move(field, -1);
        } else if (event.key === 'ArrowDown' && move && field) {
            event.preventDefault();
            move(field, 1);
        }
    }
    let error = $derived(valid(text));
    // Grow the sizer when text or status changes.
    $effect(() => {
        if (sizer) {
            // Set the invisible sizer to the text to set the container's width.
            // The browser strips trailing spaces, causing jitter after a space, so we replace
            // them with non-breaking spaces.
            const sizedText = showPlaceholder()
                ? placeholder
                : text.replace(/\s$/g, '\u00a0');
            // Clip the text to prevent this editor from getting too long when editing. If it goes past one line,
            // the measurements and layout are way off.
            const trimmedText =
                width !== undefined &&
                (clip === true || status === Status.Editing)
                    ? sizedText.substring(0, width) + '…'
                    : sizedText;
            sizer.innerHTML = trimmedText;
        }
    });
    // When status changes, focus or blur.
    $effect(() => {
        if (field) {
            if (status === Status.Editing) {
                field.focus();
            } else {
                field.blur();
            }
        }
    });
    // When text changes, save, unless we only save on exit.
    $effect(() => {
        if (!saveOnExit) saveText(text);
    });
</script>

<span
    class={`text-editor ${showPlaceholder() ? 'placeholder' : ''} ${
        status === Status.Viewing ? 'viewing' : ''
    }`}
>
    <span
        class={`sizer ${error ? 'error' : ''}`}
        aria-hidden={true}
        bind:this={sizer}
        onclick={startEditing}
></span>
    <input
        type="text"
        bind:this={field}
        bind:value={text}
        required
        aria-invalid={error !== undefined}
        aria-label={label}
        aria-placeholder={label}
        {placeholder}
        onchange={edit}
        onkeydown={handleKeyPress}
        onblur={stopEditing}
        onfocus={startEditing}
    />
    {#if error && status === Status.Editing}
        <span
            aria-live="polite"
            class={`text-editor-error ${
                status === Status.Editing ? 'editing' : ''
            }`}
        >
            {error}
        </span>
    {/if}
</span>
<span style:font-size="small">✐</span>

<style>
    .text-editor {
        position: relative;
        display: inline-block;
        max-width: 100%;
    }

    input[type='text'] {
        cursor: pointer;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%; /* Fill the entire space so that alignment with sizer is correct.*/
        height: 100%;
        min-width: 0.5em;
    }

    /* Match the parent's styling as much as possible. */
    input[type='text'],
    .sizer {
        background-color: inherit;
        font-family: inherit;
        font-size: inherit;
        font-weight: inherit;
        font-style: inherit;
        line-height: inherit;
        color: inherit;
        box-sizing: content-box;
        padding: 0;
        margin: 0;
        display: inline;
        cursor: text;
        vertical-align: inherit;
    }

    input[type='text']:focus {
        outline: none;
        border: none;
        border-bottom: var(--app-chrome-border-size) solid
            var(--app-interactive-color);
    }

    /* This ensures the error message always appears below empty text editors */
    .sizer {
        display: inline-block;
        max-width: 100%;
        min-height: 1em;
        opacity: 0;
        border: none;
        outline: none;
    }

    .sizer.error {
        border-bottom: var(--app-chrome-border-size) solid
            var(--app-error-color) !important;
    }

    .viewing .sizer {
        opacity: 1;
    }

    /* This ensures that the sizer doesn't end up with zero width and height. */
    .sizer:empty:before {
        content: '\200b';
    }

    /* Override the inherited color of the text is a placeholder */
    .placeholder .sizer {
        color: var(--app-muted-color);
    }

    /* Hide the text field when its being viewed so we can let the sizer display the full value, in case it's long. */
    .text-editor.viewing input {
        opacity: 0;
    }

    .editing {
        /* Put this above other errors nearby. */
        z-index: 4;
    }

    .text-editor-error {
        position: absolute;
        left: 0;
        top: 100%;
        width: max-content;
        z-index: 3;
        line-height: 1em;
        margin-left: -0.5em;
        padding: 0.5em 0.5em;
        font-family: var(--app-font);
        font-size: small;
        font-weight: normal;
        font-style: normal;
        color: var(--app-error-color);
        border-radius: var(--app-chrome-roundedness);
        background: var(--app-chrome-background);
    }
</style>
