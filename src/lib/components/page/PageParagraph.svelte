<p><slot></slot></p>

<style>
    p {
        margin-top: var(--bookish-header-spacing);
        font-family: var(--bookish-paragraph-font-family);
        font-size: var(--bookish-paragraph-font-size);
        color: var(--bookish-paragraph-color);

        margin-top: var(--bookish-paragraph-spacing);
        margin-bottom: var(--bookish-paragraph-spacing);

        line-height: var(--bookish-paragraph-line-height);

        /* Allow paragraphs to break on words to support small screens. */
        word-break: break-word;
    }
</style>