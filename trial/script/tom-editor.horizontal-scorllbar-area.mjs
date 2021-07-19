"use strict";

/**
 * 水平方向のスクロールバー領域です。
 */
const HorizontalScrollbarArea = class {

  /**
   * 水平方向のスクロールバー領域を初期化します。
   * @param {Element} superRoot エディター本体を表すHTML要素です。
   * @param {number} lineNumberAreaWidth 行番号領域の横幅です。
   * @param {number} virticalScrollbarAreaWidth 水平方向のスクロールバー領域の横幅です。
   */
  constructor(superRoot, lineNumberAreaWidth, virticalScrollbarAreaWidth) {
    Object.seal(this);

    // 領域を初期化します。
    this.root = document.createElement("div");
    this.root.style.background = "transparent";
    this.root.style.bottom = "0";
    this.root.style.display = "none";
    this.root.style.height = "1rem";
    this.root.style.left = `${lineNumberAreaWidth}px`;
    this.root.style.position = "absolute";
    this.root.style.right = `${virticalScrollbarAreaWidth}px`;
    superRoot.appendChild(this.root);

    // スクロールバーを初期化します。
    this.horizontalScrollbar = document.createElement("div");
    this.horizontalScrollbar.style.background = "rgba(238, 238, 238)";
    this.horizontalScrollbar.style.height = "100%";
    this.horizontalScrollbar.style.left = "0";
    this.horizontalScrollbar.style.position = "absolute";
    this.horizontalScrollbar.style.width = "100%";
    this.root.appendChild(this.horizontalScrollbar);
  }

  /** @type {Element} 自身（水平方向のスクロールバー領域）を表すHTML要素です。 */
  root;

  /** @type {Element} スクロールバーを表すHTML要素です。 */
  horizontalScrollbar;

  /**
   * スクロールバーの状態を更新します。
   * @param {number} textAreaOffsetWidth 文字領域の内容量の横幅です。
   * @param {number} textAreaScrollWidth 文字領域の完全な横幅です。
   * @param {number} textAreaScrollLeft 文字領域の横方向のスクロール量です。
   */
  resetHorizontalScrollbar = (textAreaOffsetWidth, textAreaScrollWidth, textAreaScrollLeft) => {

    // 文字領域内容量の横幅が文字領域横幅に収まっているときはスクロールバーを表示しません。
    if (!(textAreaOffsetWidth < textAreaScrollWidth)) {
      this.root.style.display = "none";
      return;
    }

    // スクロールバーのスタイルを更新します。
    this.root.style.display = "block";
    this.horizontalScrollbar.style.width = new Intl.NumberFormat("ja", {
      maximumSignificantDigits: 4,
      style: "percent"
    }).format(textAreaOffsetWidth / textAreaScrollWidth);

    // スクロールバーの位置を更新します。
    this.horizontalScrollbar.style.left = `${textAreaScrollLeft * (textAreaOffsetWidth / textAreaScrollWidth)}px`;
  };
};

export {
  HorizontalScrollbarArea
}
