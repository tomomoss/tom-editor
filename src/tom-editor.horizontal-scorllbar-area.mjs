"use strict";

/**
 * 水平方向のスクロールバー領域です。
 */
const HorizontalScrollbarArea = class {

  /**
   * 水平方向のスクロールバー領域を初期化します。
   * @param {HTMLDivElement} editor エディター本体です。
   * @param {number} left 当領域の配置場所となる水平座標です。
   */
  constructor(editor, left) {
    this.horizontalScrollbarArea = this.createHorizontalScrollbarArea(left);
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
    this.horizontalScrollbar.style.left = `${textAreaScrollLeft * textAreaClientWidth / textAreaScrollWidth}px`;
    this.horizontalScrollbar.style.width = `${textAreaClientWidth / textAreaScrollWidth * 100}%`;
  };

  /**
   * 水平方向のスクロールバー領域の横幅を調整します。
   * @param {number} textAreaWidth 文字領域の横幅です。
   */
  adjustHorizontalScrollbarAreaWidth = (textAreaWidth) => {
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
   * @param {number} left 当領域の配置場所となる水平座標です。
   * @returns {HTMLDivElement} 水平方向のスクロールバー領域です。
   */
  createHorizontalScrollbarArea = (left) => {
    const horizontalScrollbarArea = document.createElement("div");
    horizontalScrollbarArea.classList.add("tom-editor__horizontal-scrollbar-area");
    horizontalScrollbarArea.style.left = `${left}px`;
    return horizontalScrollbarArea;
  };

  /**
   * イベントリスナーを実装します。
   */
  setEventListeners = () => {

    // キャレットに有効なキーが入力されて文字領域の寸法とスクロール量に変化があったので、
    // それら値に合わせてこちらのスクロールバーの寸法と位置を更新します。
    this.horizontalScrollbarArea.addEventListener("keydownCaret-textArea", (event) => {
      if (!this.toggleHorizontalScrollbarAreaState(event.detail.clientWidth, event.detail.scrollWidth)) {
        return;
      }
      this.adjustHorizontalScrollbarAreaWidth(event.detail.clientWidth);
      this.adjustHorizontalScrollbarRect(event.detail.clientWidth, event.detail.scrollWidth, event.detail.scrollLeft);
    });

    // エディターの横幅が変更されたことで文字領域の横幅が変更されたので、
    // 当領域の横幅とスクロールバーの寸法・位置も更新します。
    this.horizontalScrollbarArea.addEventListener("resizeEditor-textArea", (event) => {
      if (!this.toggleHorizontalScrollbarAreaState(event.detail.clientWidth, event.detail.scrollWidth)) {
        return;
      }
      this.adjustHorizontalScrollbarAreaWidth(event.detail.clientWidth);
      this.adjustHorizontalScrollbarRect(event.detail.clientWidth, event.detail.scrollWidth, event.detail.scrollLeft);
    });
  };

  /**
   * 当領域を可視状態にするかどうかを判定して切り替えます。
   * @param {number} textAreaClientWidth 文字領域の見た目の横幅です。
   * @param {number} textAreaScrollWidth 文字領域の実際の横幅です。
   * @returns {boolean} 可視状態ならばtrueを返します。
   */
  toggleHorizontalScrollbarAreaState = (textAreaClientWidth, textAreaScrollWidth) => {
    if (textAreaClientWidth === textAreaScrollWidth) {
      if (this.horizontalScrollbarArea.classList.contains("tom-editor__horizontal-scrollbar-area--active")) {
        this.horizontalScrollbarArea.classList.remove("tom-editor__horizontal-scrollbar-area--active");
      }
      return false;
    }
    this.horizontalScrollbarArea.classList.add("tom-editor__horizontal-scrollbar-area--active");
    return true;
  };
};

export {
  HorizontalScrollbarArea
}
