<script lang="ts">
    enum Status {
        Viewing,
        Saving,
        Error,
    }

    export let on: boolean;
    export let save: (set: boolean) => Promise<void> | void;

    let saving = Status.Viewing;

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
    tabIndex="0"
    role="switch"
    aria-checked={on}
    on:keydown={(event) =>
        event.key === 'Enter' || event.key === 'Space' ? toggle() : undefined}
    on:click={toggle}
>
    <slot />
</div>

<style>
    .bookish-app-interactive {
        cursor: pointer;
    }
</style>
