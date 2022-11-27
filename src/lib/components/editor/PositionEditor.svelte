<script lang="ts">
    import type Position from "$lib/models/chapter/Position";
    import Switch from "./Switch.svelte";
    import LeftIcon from "./icons/left.svg?raw";
    import MiddleIcon from "./icons/middle.svg?raw";
    import RightIcon from "./icons/right.svg?raw";

    export let value: string;
    export let edit : (newValue: Position) => void;

    function editAsString(newValue: string) {
        edit(newValue as Position);
    }

</script>

<Switch
    options={["<", "|", ">"]}
    icons={{"<": LeftIcon, "|": MiddleIcon, ">": RightIcon}}
    value={value}
    edit={editAsString} 
/>