<script lang="ts">
    export let to: string;
    export let before: Function | undefined = undefined; 
</script>

<a href={to} on:click={() => before ? before() : undefined }><slot></slot></a>