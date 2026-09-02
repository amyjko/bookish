<script lang="ts">
    import Prism from './ExtendedPrism';

    interface Props {
        editable: boolean;
        inline: boolean;
        nodeID: number | undefined;
        edited?: ((text: string) => void) | undefined;
        language?: string | undefined;
        code: string;
    }

    let {
        editable,
        inline,
        nodeID,
        edited = undefined,
        language = undefined,
        code,
    }: Props = $props();

    let element: HTMLElement | null = $state(null);

    // Whenever the code or language changes, re-highlight the element.
    $effect(() => {
        void code;
        void language;
        if (element) {
            Prism.highlightElement(element);
        }
    });

    function handleChange() {
        if (element && edited) edited(element.innerText);
    }
</script>

<code
    data-nodeid={nodeID}
    bind:this={element}
    contenteditable={editable}
    class={`bookish-code ${
        inline ? 'bookish-code-inline' : 'bookish-code-block'
    } ${language ? `language-${language}` : ''}`}
    onblur={handleChange}>{code}</code
>

<!-- These styles are global because Prism inserts token elements at runtime
     that the compiler cannot see, and because other components render
     bookish-code elements of their own. -->
<style>
    :global {
        .bookish-code {
            font-family: var(--bookish-code-font-family);
            font-weight: var(--bookish-code-font-weight);
            font-size: var(--bookish-code-font-size);
            border: 1px solid var(--bookish-border-color-light);
            color: var(--bookish-muted-color);
            background-color: var(--bookish-block-background-color);
            clear: both;
            overflow-x: scroll;
        }

        code {
            font-family: var(--bookish-code-font-family);
            font-weight: var(--bookish-code-font-weight);
            font-size: var(--bookish-code-font-size);
        }

        .bookish-code-block {
            display: block;
            padding: var(--bookish-block-padding);
            line-height: var(--bookish-paragraph-line-height-tight);
            border-radius: var(--bookish-roundedness);
        }

        .bookish-code-block.wrap {
            white-space: pre-wrap !important;
        }

        .bookish-code-inline {
            display: inline;
            padding: calc(1.5 * var(--bookish-inline-padding))
                var(--bookish-inline-padding);
            white-space: pre-line !important;
        }

        .bookish-code-inline code {
            display: inline;
            padding: 0em;
        }

        /* PrismJS 1.29.0
        https://prismjs.com/download.html#themes=prism&languages=markup+css+clike+javascript+python */
        /**
        * prism.js default theme for JavaScript, CSS and HTML
        * Based on dabblet (http://dabblet.com)
        * @author Lea Verou
        */

        code[class*='language-'] {
            color: var(--bookish-paragraph-color);
            background: none;
            font-family: var(--bookish-code-font-family);
            font-size: var(--bookish-code-font-size);
            text-align: left;
            white-space: pre;
            word-spacing: normal;
            word-break: normal;
            word-wrap: normal;
            line-height: 1.5;

            -moz-tab-size: 4;
            -o-tab-size: 4;
            tab-size: 4;

            -webkit-hyphens: none;
            -moz-hyphens: none;
            -ms-hyphens: none;
            hyphens: none;
        }

        .token.comment,
        .token.prolog,
        .token.doctype,
        .token.cdata {
            color: var(--bookish-comment-color);
        }

        .token.punctuation {
            color: var(--bookish-muted-color);
        }

        .token.namespace {
            opacity: 0.7;
        }

        .token.property,
        .token.tag,
        .token.boolean,
        .token.number,
        .token.constant,
        .token.symbol,
        .token.deleted {
            color: var(--bookish-error-color);
        }

        .token.selector,
        .token.attr-name,
        .token.string,
        .token.char,
        .token.builtin,
        .token.inserted {
            color: var(--bookish-pragraph-color);
        }

        .token.operator,
        .token.entity,
        .token.url {
            color: var(--bookish-bullet-color);
        }

        .token.atrule,
        .token.attr-value,
        .token.keyword {
            color: var(--bookish-link-color);
        }

        .token.regex,
        .token.important,
        .token.variable,
        .token.function,
        .token.class-name {
            color: var(--bookish-highlight-color);
        }

        .token.important,
        .token.bold {
            font-weight: bold;
        }
        .token.italic {
            font-style: italic;
        }

        .token.entity {
            cursor: help;
        }
    }
</style>
