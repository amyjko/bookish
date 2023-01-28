<script lang="ts">
    import BookSaveStatus from '../../models/book/BookSaveStatus';
    import { getStatus } from './Contexts';

    let status = getStatus();
</script>

<span
    class={`status ${
        $status === BookSaveStatus.Saving
            ? 'status-saving'
            : $status === BookSaveStatus.Error
            ? 'status-error'
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
        color: var(--app-muted-color);
        font-family: var(--app-font);
        white-space: nowrap;
    }

    .status-error {
        color: var(--app-error-color);
        animation: failure 100ms infinite;
    }

    .status-saving {
        animation: waiting 100ms infinite;
    }

    @keyframes waiting {
        from,
        to {
            transform: scale(1, 1);
        }
        25% {
            transform: scale(1, 1.2);
        }
        50% {
            transform: scale(1, 1);
        }
        75% {
            transform: scale(1, 1.1);
        }
    }
</style>
