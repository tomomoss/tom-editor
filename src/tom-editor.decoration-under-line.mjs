"use strict";

/**
 * 現在フォーカスしている行の位置を分かりやすくするための装飾下線です。
 */
const DecorationUnderline = class {

  /**
   * 装飾下線を初期化します。
   * @param {HTMLDivElement} tomEditor エディター本体です。
   * @param {number} textAreaLeft 文字領域のウィンドウ左端からの配置距離です。
   * @param {number} textAreaWidth 文字領域の横幅です。
   */
  constructor(tomEditor, textAreaLeft, textAreaWidth) {
    this.decorationUnderline = this.createDecorationUnderline();
    this.adjustHorizontalScrollbarAreaBoundingClientRect(textAreaLeft, textAreaWidth);
    tomEditor.appendChild(this.decorationUnderline);
  }

  /** @type {HTMLDivElement} 装飾下線です。 */
  decorationUnderline = null;

  /**
 * 水平方向のスクロールバー領域の配置位置や寸法を調整します。
 * @param {number} textAreaLeft 文字領域のウィンドウ左端からの配置距離です。
 * @param {number} textAreaWidth 文字領域の横幅です。
 */
  adjustHorizontalScrollbarAreaBoundingClientRect = (textAreaLeft, textAreaWidth) => {
    this.decorationUnderline.style.left = `${textAreaLeft}px`;
    this.decorationUnderline.style.width = `${textAreaWidth}px`;
  };

  /**
   * 装飾下線を生成します。
   * @returns {HTMLDivElement} 装飾下線です。
   */
  createDecorationUnderline = () => {
    const decorationUnderline = document.createElement("div");
    decorationUnderline.classList.add("tom-editor__decoration-underline");
    return decorationUnderline;
  };
};

export {
  DecorationUnderline
}
