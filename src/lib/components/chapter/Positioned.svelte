<script lang="ts">
    import type Position from "$lib/models/chapter/Position";

    export let position: Position;

</script>

<div class={position === "<" ? "inset-left" : position === ">" ? "inset-right" : ""}><slot></slot></div>

<style>
	/* Desktop */
	@media screen and (min-width: 1200px) {
        .inset-left {
            float: left;
            clear: both;
            width: 75%;
            margin-left: -30% !important;
            margin-right: 2em;
        }

        .inset-right {
            float: right;
            clear: both;
            width: 75%;
            margin-right: -30% !important;
            margin-left: 2em;
        }
    }


</style>