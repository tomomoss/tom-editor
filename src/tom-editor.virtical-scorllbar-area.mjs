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

    // キャレットにキー入力があり押されたキーに応じた処理を文字領域に適用した後、
    // 文字領域の見た目の高さと実際の高さが送信されてきます。
    this.virticalScrollbarArea.addEventListener("keydownCaret2", (event) => {
      if (event.detail.clientHeight === event.detail.scrollHeight) {
        this.virticalScrollbar.style.height = 0;
        this.virticalScrollbar.scrollTop = 0;
        return;
      }
      this.virticalScrollbar.style.height = `${event.detail.clientHeight / event.detail.scrollHeight * 100}%`;
      this.virticalScrollbar.scrollTop = event.detail.scrollTop * event.detail.clientHeight / event.detail.scrollHeight;
    });
  };
};

export {
  VirticalScrollbarArea
}
