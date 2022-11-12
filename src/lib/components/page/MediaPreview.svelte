<script lang="ts">
    export let url: string;
    export let alt: string;
</script>
    
<span class={"bookish-figure-preview"}>
    <img 
        src={url} 
        alt={alt}
    />
    <div class="bookish-figure-credit"><slot></slot></div>
</span>