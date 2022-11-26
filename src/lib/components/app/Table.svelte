<section>
    <table>
        <slot></slot>
    </table>
</section>

<style>
    section {
        width: 100%;
        overflow-x: auto;
        margin-top: var(--bookish-app-content-spacing);
        margin-bottom: var(--bookish-app-content-spacing);
        border-top: var(--bookish-app-chrome-border-width) solid var(--bookish-app-chrome-border-color);
        border-bottom: var(--bookish-app-chrome-border-width) solid var(--bookish-app-chrome-border-color);
    }

    table {
        width: 100%;
        border-collapse: collapse;
        clear: both;
        border-collapse: separate;
        border-spacing: 0;
    }

</style>