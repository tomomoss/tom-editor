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
   * 水平方向のスクロールバーの寸法と位置を調整します。
   * @param {number} textAreaClientWidth 文字領域の見た目の横幅です。
   * @param {number} textAreaScrollWidth 文字領域の実際の横幅です。
   * @param {number} textAreaScrollLeft 文字領域の水平方向のスクロール量です。
   */
  adjustHorizontalScrollbarRect = (textAreaClientWidth, textAreaScrollWidth, textAreaScrollLeft) => {
    if (textAreaClientWidth === textAreaScrollWidth) {
      if (this.horizontalScrollbarArea.classList.contains("tom-editor__horizontal-scrollbar-area--active")) {
        this.horizontalScrollbarArea.classList.remove("tom-editor__horizontal-scrollbar-area--active");
      }
      return;
    }
    this.horizontalScrollbarArea.classList.add("tom-editor__horizontal-scrollbar-area--active");
    this.horizontalScrollbar.style.left = `${textAreaScrollLeft * textAreaClientWidth / textAreaScrollWidth}px`;
    this.horizontalScrollbar.style.width = `${textAreaClientWidth / textAreaScrollWidth * 100}%`;
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

  /**
   * イベントリスナーを実装します。
   * @param {HTMLDivElement} textArea 文字領域です。
   */
  setEventListeners = (textArea) => {

    // キャレットに有効なキーが入力されて文字領域の寸法とスクロール量に変化があったので、
    // それら値に合わせてこちらのスクロールバーの寸法と位置を更新します。
    this.horizontalScrollbarArea.addEventListener("keydownCaret-textArea", (event) => {
      this.adjustHorizontalScrollbarRect(event.detail.clientWidth, event.detail.scrollWidth, event.detail.scrollLeft);
    });

    // エディターの横幅が変更されたので、当領域の座標と寸法を変更します。
    this.horizontalScrollbarArea.addEventListener("resizeEditor", (event) => {
      const textAreaRect = textArea.getBoundingClientRect();
      this.horizontalScrollbarArea.style.left = `${textAreaRect.left - event.detail.left}px`;
      this.horizontalScrollbarArea.style.width = `${textAreaRect.width}px`;
    });
  };
};

export {
  HorizontalScrollbarArea
}
