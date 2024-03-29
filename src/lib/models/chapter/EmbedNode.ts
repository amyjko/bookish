import type Node from './Node';
import type Position from './Position';
import FormatNode from './FormatNode';
import TextNode from './TextNode';
import BlockNode from './BlockNode';
import type { CaretRange } from './Caret';
import type RootNode from './RootNode';
import type Caret from './Caret';

// This is what we use to encode URLs in the URL field of the embed node.
const URL_SEPARATOR = '*';

export default class EmbedNode extends BlockNode {
    /**
     * The URL is actually a list of up to two URLs. The first is a full-size image URL, the second is a smaller image.
     * These are used for responsive rendering and to limit bandwidth usage. Any image URLs after the second are ignored.
     */
    readonly #urls: string;
    readonly #description: string;
    readonly #caption: FormatNode;
    readonly #credit: FormatNode;
    readonly #position: Position;

    constructor(
        url: string,
        description: string,
        caption?: FormatNode,
        credit?: FormatNode,
        position: Position = '|',
    ) {
        super();

        this.#urls = url;
        this.#description = description;
        this.#caption =
            caption === undefined
                ? new FormatNode('', [new TextNode()])
                : caption.withTextIfEmpty();
        this.#credit =
            credit == undefined
                ? new FormatNode('', [new TextNode()])
                : credit.withTextIfEmpty();
        this.#position = position;
    }

    getType() {
        return 'embed';
    }

    isVideo() {
        return (
            this.#urls.includes('https://www.youtube.com') ||
            this.#urls.includes('https://youtu.be') ||
            this.#urls.includes('https://www.tiktok.com') ||
            this.#urls.includes('vimeo.com')
        );
    }
    getURL() {
        return this.#urls.split(URL_SEPARATOR)[0];
    }
    getSmallURL() {
        return this.isLocal()
            ? 'images/small/' + this.getURL()
            : this.hasSmallURL()
              ? this.#urls.split(URL_SEPARATOR)[1]
              : this.getURL();
    }
    hasSmallURL() {
        return (
            this.#urls.split(URL_SEPARATOR).length > 1 &&
            this.#urls.split(URL_SEPARATOR)[1].trim().length > 0
        );
    }
    isHosted() {
        return this.#urls.includes('bookish');
    }
    isLocal() {
        return this.#urls.length > 0 && !this.#urls.startsWith('http');
    }
    getDescription() {
        return this.#description;
    }
    getCaption() {
        return this.#caption;
    }
    getCredit() {
        return this.#credit;
    }
    getPosition() {
        return this.#position;
    }
    getFormats() {
        return [this.#caption, this.#credit];
    }
    getChildren() {
        return [this.#caption, this.#credit];
    }
    getParentOf(node: Node): Node | undefined {
        if (node === this.#caption || node === this.#credit) return this;
        const captionParent = this.#caption.getParentOf(node);
        if (captionParent) return captionParent;
        const creditParent = this.#credit.getParentOf(node);
        if (creditParent) return creditParent;
    }

    toText(): string {
        return this.#caption.toText();
    }
    toHTML(): string {
        return `<img src="${this.getURL()}" alt="${this.getDescription()}" />`;
    }
    toBookdown(): string {
        return `|${this.#urls}|${
            this.#description
        }|${this.#caption.toBookdown()}|${this.#credit.toBookdown()}|${
            this.#position === '|' ? '' : this.#position
        }`;
    }
    toJSON() {
        return {
            url: this.#urls,
            alt: this.#description,
            caption: this.#caption.toText(),
            credit: this.#credit.toText(),
        };
    }

    copy() {
        return new EmbedNode(
            this.#urls,
            this.#description,
            this.#caption.copy(),
            this.#credit.copy(),
            this.#position,
        ) as this;
    }

    withChildReplaced(node: Node, replacement: Node | undefined) {
        const newCaption =
            node === this.#caption &&
            (replacement === undefined || replacement instanceof FormatNode)
                ? replacement
                : this.#caption;
        const newCredit =
            node === this.#credit &&
            (replacement === undefined || replacement instanceof FormatNode)
                ? replacement
                : this.#credit;
        return newCaption || newCredit
            ? (new EmbedNode(
                  this.#urls,
                  this.#description,
                  newCaption,
                  newCredit,
                  this.#position,
              ) as this)
            : undefined;
    }

    withURL(url: string) {
        // If the URL is a YouTube URL, convert to an embed URL, since a raw YouTube URL is never valid for embedding.
        if (url.includes('www.youtube.com/watch?v='))
            url = url.replace('/watch?v=', '/embed/');

        return new EmbedNode(
            url,
            this.#description,
            this.#caption,
            this.#credit,
            this.#position,
        );
    }
    withURLs(url: string, thumbnail: string) {
        return new EmbedNode(
            url + URL_SEPARATOR + thumbnail,
            this.#description,
            this.#caption,
            this.#credit,
            this.#position,
        );
    }
    withDescription(description: string) {
        return new EmbedNode(
            this.#urls,
            description,
            this.#caption,
            this.#credit,
            this.#position,
        );
    }
    withCaption(caption: FormatNode) {
        return new EmbedNode(
            this.#urls,
            this.#description,
            caption,
            this.#credit,
            this.#position,
        );
    }
    withCredit(credit: FormatNode) {
        return new EmbedNode(
            this.#urls,
            this.#description,
            this.#caption,
            credit,
            this.#position,
        );
    }
    withPosition(position: Position) {
        return new EmbedNode(
            this.#urls,
            this.#description,
            this.#caption,
            this.#credit,
            position,
        );
    }

    withContentInRange(range: CaretRange): this | undefined {
        if (!this.contains(range.start.node) && !this.contains(range.end.node))
            return this.copy();
        const newCredit =
            this.#credit.contains(range.end.node) ||
            this.#credit.contains(range.start.node)
                ? this.#credit.withContentInRange(range)
                : new FormatNode('', [new TextNode()]);
        const newCaption =
            this.#caption.contains(range.start.node) ||
            this.#caption.contains(range.end.node)
                ? this.#caption.withContentInRange(range)
                : new FormatNode('', [new TextNode()]);
        if (newCaption === undefined || newCredit === undefined) return;

        return new EmbedNode(
            this.#urls,
            this.#description,
            newCaption,
            newCredit,
            this.#position,
        ) as this;
    }

    nextWord(): Caret {
        return this.#caption.getFirstCaret() as Caret;
    }

    previousWord(root: RootNode): Caret {
        const previous = root.getPreviousTextOrAtom(
            this.#caption.getFirstTextNode(),
        );
        return previous
            ? {
                  node: previous,
                  index:
                      previous instanceof TextNode ? previous.getLength() : 0,
              }
            : { node: this, index: 0 };
    }
}
