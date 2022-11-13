<script lang="ts">
    import TextEditor from "$lib/components/editor/TextEditor.svelte";
    import { subdomainIsAvailable } from "$lib/models/Firestore";
    import { getBook } from "./Contexts";

    

    let book = getBook();
    
    const invalidNames: string[] = [ "email", "login", "confirm", "read", "write" ];
    
</script>

<span class="bookish-muted">
    <TextEditor 
        startText={book.getSubdomain() ?? ""} 
        label="Book domain editor"
        save={
            // Save the new domain
            async domain => {
                const available = await subdomainIsAvailable(domain, book);
                if(available)
                    book.setSubdomain(domain);
                else throw Error("Domain isn't available");
            }
        }
        placeholder="book name"
        valid={newDomain =>
            // If not the empty string, must be a valid URL subdomain, and none of the existing routes.
            invalidNames.includes(newDomain) || (newDomain.length > 0 && !/^[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?$/.test(newDomain)) ? `Book domains must be fewer than 63 characters, made of symbols a-z, A-Z, and 0-9, and not one of ${invalidNames.join(", ")}.` :
            undefined
        }
        saveOnExit={true}
    />
    <br/>
</span>
