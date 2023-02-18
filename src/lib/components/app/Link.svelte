<script lang="ts">
    export let to: string;
    export let before: Function | undefined = undefined;
    export let title: string | undefined = undefined;
    export let external: boolean = false;
</script>

<a
    href={to}
    {title}
    on:click={() => (before ? before() : undefined)}
    target={to.startsWith('http') || external ? '_blank' : null}
    rel={external ? 'noreferrer' : null}><slot /></a
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
