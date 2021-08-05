"use strict";

/**
 * 水平方向のスクロールバー領域です。
 */
const HorizontalScrollbarArea = class {

  /**
   * 水平方向のスクロールバー領域を初期化します。
   * @param {HTMLDivElement} tomEditor エディター本体です。
   * @param {number} textAreaLeft 文字領域のウィンドウ左端からの配置距離です。
   * @param {number} textAreaWidth 文字領域の横幅です。
   */
  constructor(tomEditor, textAreaLeft, textAreaWidth) {
    this.horizontalScrollbarArea = this.createHorizontalScrollbarArea();
    this.adjustHorizontalScrollbarAreaBoundingClientRect(textAreaLeft, textAreaWidth);
    tomEditor.appendChild(this.horizontalScrollbarArea);
    this.horizontalScrollbar = this.createHorizontalScrollbar();
    this.horizontalScrollbarArea.appendChild(this.horizontalScrollbar);
  }

  /** @type {HTMLDivElement} 水平方向のスクロールバーです。 */
  horizontalScrollbar;

  /** @type {HTMLDivElement} 水平方向のスクロールバー領域です。 */
  horizontalScrollbarArea;

  /**
   * 水平方向のスクロールバー領域の配置位置や寸法を調整します。
   * @param {number} textAreaLeft 文字領域のウィンドウ左端からの配置距離です。
   * @param {number} textAreaWidth 文字領域の横幅です。
   */
  adjustHorizontalScrollbarAreaBoundingClientRect = (textAreaLeft, textAreaWidth) => {
    this.horizontalScrollbarArea.style.left = `${textAreaLeft}px`;
    this.horizontalScrollbarArea.style.width = `${textAreaWidth}px`;
  };

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
};

export {
  HorizontalScrollbarArea
}
