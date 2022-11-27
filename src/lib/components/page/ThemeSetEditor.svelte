<script lang="ts">
    import PageHeader from "./PageHeader.svelte";
    import ThemeVariableEditor from "./ThemeVariableEditor.svelte";

    export let header: string;
    export let group: string;
    export let properties: Record<string,string>;

</script>

<PageHeader>{header}</PageHeader>
<div class="bookish-table">
    <table>
        <tbody>
        {#each Object.keys(properties).sort() as property }
            <ThemeVariableEditor group={group} name={property} value={properties[property]} />
        {/each}
        </tbody>
    </table>
</div>