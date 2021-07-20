"use strict";

/**
 * 縦方向のスクロールバー領域です。
 */
const VirticalScrollbarArea = class {

  /**
   * 縦方向のスクロールバー領域を初期化します。
   * @param {Element} superRoot エディター本体を表すHTML要素です。
   */
  constructor(superRoot) {
    Object.seal(this);

    // 領域を初期化します。
    this.root = document.createElement("div");
    this.root.background = "rgb(255, 255, 255)";
    this.root.style.borderLeft = "solid 0.1rem rgb(238, 238, 238)";
    this.root.style.flex = "0 0 1rem";
    this.root.style.position = "relative";
    this.root.style.zIndex = "1";
    superRoot.appendChild(this.root);

    // スクロールバーを初期化します。
    this.virticalScrollbar = document.createElement("div");
    this.virticalScrollbar.style.background = "rgb(238, 238, 238)";
    this.virticalScrollbar.style.display = "none";
    this.virticalScrollbar.style.height = "100%";
    this.virticalScrollbar.style.position = "absolute";
    this.virticalScrollbar.style.top = "0";
    this.virticalScrollbar.style.width = "100%";
    this.root.appendChild(this.virticalScrollbar);
  }

  /** @type {Element} 自身（縦方向のスクロールバー領域）を表すHTML要素です。 */
  root;

  /** @type {Element} スクロールバーを表すHTML要素です。 */
  virticalScrollbar;

  /**
   * スクロールバーの状態を更新します。
   * @param {number} textAreaContentHeight 文字領域の内容量の縦幅です。
   * @param {number} textAreaScrollHeight 文字領域の完全な縦幅です。
   * @param {number} textAreaScrollTop 文字領域の縦方向のスクロール量です。
   */
  resetVirticalScrollbar = (textAreaContentHeight, textAreaScrollHeight, textAreaScrollTop) => {

    console.log(textAreaContentHeight, textAreaScrollHeight);
    // 文字領域内容量の横幅が文字領域横幅に収まっているときはスクロールバーを表示しません。
    if (!(textAreaContentHeight < textAreaScrollHeight)) {
      this.virticalScrollbar.style.display = "none";
      return;
    }

    // スクロールバーのスタイルを更新します。
    this.virticalScrollbar.style.display = "";
    this.virticalScrollbar.style.height = new Intl.NumberFormat("ja", {
      maximumSignificantDigits: 4,
      style: "percent"
    }).format(textAreaContentHeight / textAreaScrollHeight);

    // スクロールバーの位置を更新します。
    this.virticalScrollbar.style.top = `${textAreaScrollTop * (textAreaContentHeight / textAreaScrollHeight)}px`;
  };
};

export {
  VirticalScrollbarArea
}
