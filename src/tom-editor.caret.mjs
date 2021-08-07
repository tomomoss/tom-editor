"use strict";

/**
 * キャレットです。
 */
const Caret = class {

  /**
   * キャレットを初期化します。
   * @param {HTMLDivElement} editor エディター本体です。
   */
  constructor(editor) {
    this.caret = this.createCaret();
    editor.appendChild(this.caret);
  }

  /** @type {HTMLDivElement} キャレットです。 */
  caret = null;

  /**
   * キャレットを生成します。
   * @returns {HTMLDivElement} キャレットです。
   */
  createCaret = () => {
    const caret = document.createElement("textarea");
    caret.classList.add("tom-editor__caret");
    return caret;
  };

  /**
   * キャレットの配置処理です。
   * @param {number} positionLeft 水平座標です。
   * @param {number} positionTop 垂直座標です。
   */
  putCaret = (positionLeft, positionTop) => {
    this.caret.classList.add("tom-editor__caret--focus");
    this.caret.style.left = `${positionLeft}px`;
    this.caret.style.top = `${positionTop}px`;
    this.caret.focus();
    this.caret.classList.remove("tom-editor__caret--active");
    setTimeout(() => {
      this.caret.classList.add("tom-editor__caret--active");
    }, 0);
  };

  /**
   * キャレットの除外処理です。
   */
  takeCaret = () => {
    this.caret.classList.remove("tom-editor__caret--active", "tom-editor__caret--focus");
  };

  /**
   * イベントリスナーを実装します。
   * @param {HTMLDivElement} textArea 文字領域です。
   * @param {HTMLDivElement} lineNumberArea 行番号領域です。
   */
  setEventListeners = (textArea, lineNumberArea) => {

    // キャレットからフォーカスを外します。
    // 文字領域と行番号領域にフォーカスが外れた旨を通知します。
    this.caret.addEventListener("blur", () => {
      this.takeCaret();
      textArea.dispatchEvent(new CustomEvent("blurCaret"));
      lineNumberArea.dispatchEvent(new CustomEvent("blurCaret"));
    });

    // キー入力を検知したら文字領域に押されたキー情報を通知します。
    this.caret.addEventListener("keydown", (event) => {
      textArea.dispatchEvent(new CustomEvent("keydownCaret", {
        detail: {
          key: event.key
        }
      }));
    });

    // フォーカスする文字が更新されたので更新後の文字の位置を受けとります。
    this.caret.addEventListener("mousedownTextArea", (event) => {
      this.putCaret(event.detail.left, event.detail.top);
    });
  };
};

export {
  Caret
}
