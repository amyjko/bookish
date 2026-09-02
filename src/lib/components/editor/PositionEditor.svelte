<script lang="ts">
    import type Position from '$lib/models/chapter/Position';
    import Switch from './Switch.svelte';
    import LeftIcon from './icons/left.svg?raw';
    import MiddleIcon from './icons/middle.svg?raw';
    import RightIcon from './icons/right.svg?raw';

    interface Props {
        value: string;
        edit: (newValue: Position) => void;
    }

    let { value, edit }: Props = $props();

    function editAsString(newValue: string) {
        edit(newValue as Position);
    }
</script>

<Switch
    options={['<', '|', '>']}
    icons={{ '<': LeftIcon, '|': MiddleIcon, '>': RightIcon }}
    {value}
    edit={editAsString}
/>
