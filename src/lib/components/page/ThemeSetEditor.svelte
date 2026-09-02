<script lang="ts">
    import PageHeader from './PageHeader.svelte';
    import Rows from './Rows.svelte';
    import ThemeVariableEditor from './ThemeVariableEditor.svelte';

    interface Props {
        header: string;
        group: string;
        properties: Record<string, string>;
    }

    let { header, group, properties }: Props = $props();
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
