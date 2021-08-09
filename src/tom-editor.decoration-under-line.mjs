"use strict";

/**
 * 現在フォーカスしている行の位置を分かりやすくするための装飾下線です。
 */
const DecorationUnderline = class {

  /**
   * 装飾下線を初期化します。
   * @param {HTMLDivElement} editor エディター本体です。
   * @param {number} left 装飾下線の配置場所となる水平座標です。
   */
  constructor(editor, left) {
    this.decorationUnderline = this.createDecorationUnderline(left);
    editor.appendChild(this.decorationUnderline);
  }

  /** @type {HTMLDivElement} 装飾下線です。 */
  decorationUnderline = null;

  /**
   * 装飾下線を生成します。
   * @param {number} left 装飾下線の配置場所となる水平座標です。
   * @returns {HTMLDivElement} 装飾下線です。
   */
  createDecorationUnderline = (left) => {
    const decorationUnderline = document.createElement("div");
    decorationUnderline.classList.add("tom-editor__decoration-underline");
    decorationUnderline.style.left = left;
    return decorationUnderline;
  };
};

export {
  DecorationUnderline
}
