<script lang="ts">
    import type Position from "$lib/models/chapter/Position";
    import Switch from "./Switch.svelte";

    export let value: string;
    export let edit : (newValue: Position) => void;

    function editAsString(newValue: string) {
        edit(newValue as Position);
    }

</script>

<Switch
    position={value}
    options={["<", "|", ">"]}
    value={value}
    edit={editAsString} 
/>