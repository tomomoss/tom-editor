"use strict";

/**
 * 垂直方向のスクロールバー領域です。
 */
const VirticalScrollbarArea = class {

  /**
   * 垂直方向のスクロールバー領域を初期化します。
   * @param {HTMLDivElement} editor エディター本体です。
   */
  constructor(editor) {
    this.virticalScrollbarArea = this.createVirticalScrollbarArea();
    editor.appendChild(this.virticalScrollbarArea);
    this.virticalScrollbar = this.createVirticalScrollbar();
    this.virticalScrollbarArea.appendChild(this.virticalScrollbar);
  }

  /** @type {HTMLDivElement} 垂直方向のスクロールバーです。 */
  virticalScrollbar = null;

  /** @type {HTMLDivElement} 垂直方向のスクロールバー領域です。 */
  virticalScrollbarArea = null;

  /**
   * 垂直方向のスクロールバーの寸法と位置を調整します。
   * @param {number} textAreaClientHeight 文字領域の見た目の高さです。
   * @param {number} textAreaScrollHeight 文字領域の実際の高さです。
   * @param {number} textAreaScrollTop 文字領域の垂直方向のスクロール量です。
   */
  adjustVirticalScrollbarRect = (textAreaClientHeight, textAreaScrollHeight, textAreaScrollTop) => {
    if (textAreaClientHeight === textAreaScrollHeight) {
      this.virticalScrollbar.style.height = 0;
      this.virticalScrollbar.style.top = 0;
      return;
    }
    this.virticalScrollbar.style.height = `${textAreaClientHeight / textAreaScrollHeight * 100}%`;
    this.virticalScrollbar.style.top = `${textAreaScrollTop * textAreaClientHeight / textAreaScrollHeight}px`;
  };

  /**
   * 垂直方向のスクロールバーを生成します。
   * @returns {HTMLDivElement} 垂直方向のスクロールバーです。
   */
  createVirticalScrollbar = () => {
    const virticalScrollbar = document.createElement("div");
    virticalScrollbar.classList.add("tom-editor__virtical-scrollbar-area__virtical-scrollbar");
    return virticalScrollbar;
  };

  /**
   * 垂直方向のスクロールバー領域を初期化します。
   * @returns {HTMLDivElement} 垂直方向のスクロールバー領域です。
   */
  createVirticalScrollbarArea = () => {
    const virticalScrollbarArea = document.createElement("div");
    virticalScrollbarArea.classList.add("tom-editor__virtical-scrollbar-area");
    return virticalScrollbarArea;
  };

  /**
   * イベントリスナーを実装します。
   */
  setEventListeners = () => {

    // キャレットに有効なキーが入力されて文字領域の寸法とスクロール量に変化があったので、
    // それら値に合わせてこちらのスクロールバーの寸法と位置を更新します。
    this.virticalScrollbarArea.addEventListener("keydownCaret-textArea", (event) => {
      this.adjustVirticalScrollbarRect(event.detail.clientHeight, event.detail.scrollHeight, event.detail.scrollTop);
    });

    // エディター上でホイールが回されて文字領域のスクロール量に変化があったので、
    // それら値に合わせてこちらのスクロールバーの位置を更新します。
    this.virticalScrollbarArea.addEventListener("wheelEditor-textArea", (event) => {
      this.adjustVirticalScrollbarRect(event.detail.clientHeight, event.detail.scrollHeight, event.detail.scrollTop);
    });
  };
};

export {
  VirticalScrollbarArea
}
