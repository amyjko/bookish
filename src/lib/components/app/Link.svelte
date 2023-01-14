<script lang="ts">
    export let to: string;
    export let before: Function | undefined = undefined;
    export let title: string | undefined = undefined;
</script>

<a
    href={to}
    {title}
    on:click={() => (before ? before() : undefined)}
    target={to.startsWith('http') ? '_blank' : null}><slot /></a
>

<style>
    a {
        color: var(--app-interactive-color);
        font-family: var(--app-font);
        font-weight: 400;
        text-decoration: none;
    }

    a:hover {
        text-decoration: underline;
    }
</style>
