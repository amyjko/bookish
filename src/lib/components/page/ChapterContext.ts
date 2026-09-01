import type { Writable } from 'svelte/store';
import type Chapter from '../../models/book/Chapter';

type ChapterContext =
    | {
          chapter: Chapter;
          highlightedWord?: string;
          highlightedID?: string;
          marginal: Writable<string | undefined>;
          /** Request a chapter-wide marginal layout pass. Requests are
           *  coalesced into a single pass per animation frame. */
          requestLayout: () => void;
      }
    | undefined;
export type { ChapterContext as default };
