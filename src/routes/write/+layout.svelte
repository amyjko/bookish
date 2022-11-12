<script lang="ts">
    import { goto } from "$app/navigation";
    import { getContext } from "svelte";
    import type {  Writable } from "svelte/store";
    import type Authentication from "../../lib/components/Authentication";

    let auth = getContext<Writable<Authentication>>("auth");

    // Redirect to the login page if not authenticated.
    if($auth.user === null) goto("/login");

</script>

<slot></slot>