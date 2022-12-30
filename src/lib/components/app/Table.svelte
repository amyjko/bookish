<section>
    <table>
        <slot />
    </table>
</section>

<style>
    section {
        width: 100%;
        overflow-x: auto;
        margin-top: var(--app-text-spacing);
        margin-bottom: var(--app-text-spacing);
        border-top: var(--app-chrome-border-size) solid var(--app-border-color);
        border-bottom: var(--app-chrome-border-size) solid
            var(--app-border-color);
    }

    table {
        width: 100%;
        border-collapse: collapse;
        clear: both;
        border-collapse: separate;
        border-spacing: 0;
    }

    table :global(td) {
        padding: var(--app-chrome-padding);
        vertical-align: top;
        font-family: var(--app-font);
        font-weight: 300;
    }
</style>
