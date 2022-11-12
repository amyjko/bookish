<script lang="ts">
    import Footer from "./Footer.svelte";
    import Header from "./Header.svelte";
    import Auth from "../lib/components/Auth.svelte";

</script>

{#if import.meta.env.PROD }
    <br/>
    <br/>
    <br/>
    <br/>
    <br/>
    <div style="text-align:center"><strong>Bookish</strong> is coming.</div>
{:else}
    <div class="bookish-app">
        <Auth>
            <Header/>
            <slot></slot>
            <Footer/>
        </Auth>
    </div>
{/if}