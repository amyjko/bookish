<script lang="ts">

    import ThemeVariableEditor from "./ThemeVariableEditor.svelte";

    export let header: string;
    export let group: string;
    export let theme: Record<string, Record<string,string>>;

    let set = theme[group];

</script>

<h2>{header}</h2>
<div class="bookish-table">
    <table>
        <tbody>
        {#each Object.keys(set).sort() as name }
            <ThemeVariableEditor group={group} name={name} value={set[name]} />
        {/each}
        </tbody>
    </table>
</div>