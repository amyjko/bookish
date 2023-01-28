<script lang="ts">
    import BookSaveStatus from '../../models/book/BookSaveStatus';
    import { getStatus } from './Contexts';

    let status = getStatus();
</script>

<span
    class={`status ${
        $status === BookSaveStatus.Saving
            ? 'saving'
            : $status === BookSaveStatus.Error
            ? 'error'
            : ''
    }`}
>
    {$status === BookSaveStatus.Changed
        ? '\u270E Editing'
        : $status === BookSaveStatus.Saving
        ? '\u2026 Saving'
        : $status === BookSaveStatus.Saved
        ? '\u2713 Saved'
        : $status === BookSaveStatus.Error
        ? '\u2715 Not saved'
        : ''}
</span>

<style>
    .status {
        color: var(--app-font-color-inverted);
        font-family: var(--app-font);
        white-space: nowrap;
        background-color: var(--app-interactive-color);
        padding: calc(var(--app-chrome-padding) / 2);
        border-radius: var(--app-chrome-roundedness);
    }

    .error {
        background-color: var(--app-error-color);
        animation: failure 100ms infinite;
    }

    .saving {
        animation: waiting 1s infinite;
    }

    @keyframes waiting {
        0% {
            transform: rotate(-3deg);
        }
        50% {
            transform: rotate(3deg);
        }
        100% {
            transform: rotate(-3deg);
        }
    }
</style>
