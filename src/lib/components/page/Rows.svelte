<div class="table">
    <table>
        <tbody>
            <slot />
        </tbody>
    </table>
</div>

<style>
    .table {
        width: 100%;
        overflow-x: auto;
        line-height: var(--bookish-paragraph-line-height-tight);
        border-collapse: collapse;
        clear: both;
        border-radius: var(--bookish-roundedness);
        border-spacing: 0;
    }

    table {
        width: 100%;
        border-collapse: collapse;
    }

    table :global(tr:first-child th) {
        font-weight: bold;
        border: 0;
        border-bottom: 1px solid var(--bookish-border-color);
    }

    table :global(tr:nth-child(even)) {
        background-color: var(--bookish-block-background-color);
    }

    table :global(tr:last-child td:first-child) {
        border-bottom-left-radius: var(--bookish-roundedness);
    }

    table :global(tr:last-child td:last-child) {
        border-bottom-right-radius: var(--bookish-roundedness);
    }

    table :global(tr:first-child td:first-child) {
        border-top-left-radius: var(--bookish-roundedness);
    }
    table :global(tr:first-child td:last-child) {
        border-top-right-radius: var(--bookish-roundedness);
    }

    .table :global(td),
    .table :global(th) {
        padding: var(--bookish-block-padding);
    }
</style>
