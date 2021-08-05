"use strict";

/**
 * キャレットです。
 */
const Caret = class {

  /**
   * キャレットを初期化します。
   * @param {HTMLDivElement} tomEditor エディター本体です。
   */
  constructor(tomEditor) {
    this.caret = this.createCaret();
    tomEditor.appendChild(this.caret);
  }

  /** @type {HTMLDivElement} キャレットです。 */
  caret;

  /**
   * キャレットを生成します。
   * @returns {HTMLDivElement} キャレットです。
   */
  createCaret = () => {
    const caret = document.createElement("div");
    caret.classList.add("tom-editor__caret");
    return caret;
  };
};

export {
  Caret
}
