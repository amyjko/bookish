<script lang="ts">
    import { goto } from "$app/navigation";
    import { getAuth } from "$lib/components/page/Contexts";

    let auth = getAuth();

    // Redirect to the login page if not authenticated.
    if($auth.user === null) goto("/login");

</script>

<slot></slot>