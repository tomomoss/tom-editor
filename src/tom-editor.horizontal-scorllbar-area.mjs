"use strict";

/**
 * 水平方向のスクロールバー領域です。
 */
const HorizontalScrollbarArea = class {

  /**
   * 水平方向のスクロールバー領域を初期化します。
   * @param {HTMLDivElement} editor エディター本体です。
   */
  constructor(editor) {
    this.horizontalScrollbarArea = this.createHorizontalScrollbarArea();
    editor.appendChild(this.horizontalScrollbarArea);
    this.horizontalScrollbar = this.createHorizontalScrollbar();
    this.horizontalScrollbarArea.appendChild(this.horizontalScrollbar);
  }

  /** @type {HTMLDivElement} 水平方向のスクロールバーです。 */
  horizontalScrollbar = null;

  /** @type {HTMLDivElement} 水平方向のスクロールバー領域です。 */
  horizontalScrollbarArea = null;

  /**
   * 水平方向のスクロールバーを生成します。
   * @returns {HTMLDivElement} 水平方向のスクロールバーです。
   */
  createHorizontalScrollbar = () => {
    const horizontalScrollbar = document.createElement("div");
    horizontalScrollbar.classList.add("tom-editor__horizontal-scrollbar-area__horizontal-scrollbar");
    return horizontalScrollbar;
  };

  /**
   * 水平方向のスクロールバー領域を生成します。
   * @returns {HTMLDivElement} 水平方向のスクロールバー領域です。
   */
  createHorizontalScrollbarArea = () => {
    const horizontalScrollbarArea = document.createElement("div");
    horizontalScrollbarArea.classList.add("tom-editor__horizontal-scrollbar-area");
    return horizontalScrollbarArea;
  };

  /**
   * イベントリスナーを実装します。
   * @param {HTMLDivElement} textArea 文字領域です。
   */
  setEventListeners = (textArea) => {
    
    // エディターの横幅が変更されたので、当領域の座標と寸法を変更します。
    this.horizontalScrollbarArea.addEventListener("resizeEditor", () => {
      const textAreaRect = textArea.getBoundingClientRect();
      this.horizontalScrollbarArea.style.left = `${textAreaRect.left}px`;
      this.horizontalScrollbarArea.style.width = `${textAreaRect.width}px`;
    });
  };
};

export {
  HorizontalScrollbarArea
}
