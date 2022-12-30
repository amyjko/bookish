<script lang="ts">
    import PageHeader from './PageHeader.svelte';
    import Rows from './Rows.svelte';
    import ThemeVariableEditor from './ThemeVariableEditor.svelte';

    export let header: string;
    export let group: string;
    export let properties: Record<string, string>;
</script>

<PageHeader>{header}</PageHeader>

<Rows>
    {#each Object.keys(properties).sort() as property}
        <ThemeVariableEditor
            {group}
            name={property}
            value={properties[property]}
        />
    {/each}
</Rows>
