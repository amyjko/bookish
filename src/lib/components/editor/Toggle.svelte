<script lang="ts">
    enum Status {
        Viewing,
        Saving,
        Error,
    }

    interface Props {
        on: boolean;
        save: (set: boolean) => Promise<void> | void;
        children?: import('svelte').Snippet;
    }

    let { on, save, children }: Props = $props();

    let saving = $state(Status.Viewing);

    function toggle() {
        saving = Status.Saving;

        const promise = save(!on);

        if (promise === undefined) {
            saving = Status.Viewing;
            return;
        }

        promise
            .then(() => (saving = Status.Viewing))
            .catch(() => (saving = Status.Error));
    }
</script>

<div
    class={`bookish-app-interactive ${
        saving === Status.Saving ? ' bookish-text-editor-saving' : ''
    } ${saving === Status.Error ? ' bookish-text-editor-error' : ''}`}
    tabindex="0"
    role="switch"
    aria-checked={on}
    onkeydown={(event) =>
        event.key === 'Enter' || event.key === 'Space' ? toggle() : undefined}
    onclick={toggle}
>
    {@render children?.()}
</div>

<style>
    .bookish-app-interactive {
        cursor: pointer;
    }
</style>
