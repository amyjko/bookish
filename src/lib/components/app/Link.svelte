<script lang="ts">
    export let to: string;
    export let before: Function | undefined = undefined; 
</script>

<a href={to} on:click={() => before ? before() : undefined } target={to.startsWith("http") ? "_blank" : null}><slot></slot></a>

<style>
    a {        
        color: var(--bookish-app-link-color);
        font-family: var(--bookish-app-font-family);
        font-size: var(--bookish-app-font-size);
        font-weight: 400;
        text-decoration: none;
    }

    a:hover {
        text-decoration: underline;
    }
</style>