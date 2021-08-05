"use strict";

/**
 * 垂直方向のスクロールバー領域です。
 */
const VirticalScrollbarArea = class {

  /**
   * 垂直方向のスクロールバー領域を初期化します。
   * @param {HTMLDivElement} tomEditor エディター本体です。
   */
  constructor(tomEditor) {
    this.virticalScrollbarArea = this.createVirticalScrollbarArea();
    tomEditor.appendChild(this.virticalScrollbarArea);
    this.virticalScrollbar = this.createVirticalScrollbar();
    this.virticalScrollbarArea.appendChild(this.virticalScrollbar);
  }

  /** @type {HTMLDivElement} 垂直方向のスクロールバーです。 */
  virticalScrollbar;

  /** @type {HTMLDivElement} 垂直方向のスクロールバー領域です。 */
  virticalScrollbarArea;

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
};

export {
  VirticalScrollbarArea
}
