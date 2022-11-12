<script lang="ts">

    // If ends with .svg, its mapped to an asset in /svg/, otherwise just the text is displayed.
    export let name: string;

</script>

<span>
    {#if name.endsWith(".svg")}
        <img alt={`${name.replace(".svg", "")} icon`} src="/svg/{name}"/>
    {:else}
        {name}
    {/if}
</span>

<style>
    span {
        margin-right: var(--bookish-app-chrome-padding);
    }

    img {
        width: 1em;
        height: 1em;
    }
</style>