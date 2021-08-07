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
    this.caret.classList.add("tom-editor__caret--place");
    this.caret.style.left = `${positionLeft}px`;
    this.caret.style.top = `${positionTop}px`;

    // mousedownイベントのイベントリスナー内でfocusイベントを起こすと、
    // どういうわけかすぐにblueしてしまうのでsetTimeoutメソッドで非同期処理化しています。
    setTimeout(() => {
      this.caret.focus();
    }, 0);
  };

  /**
   * キャレットの除外処理です。
   */
  takeCaret = () => {
    this.caret.classList.remove("tom-editor__caret--place");
  };

  /**
   * イベントリスナーを実装します。
   * @param {HTMLDivElement} textArea 文字領域です。
   */
  setEventListeners = (textArea) => {

    // キャレットからフォーカスを外します。
    this.caret.addEventListener("blur", () => {
      this.takeCaret();
    });

    // 押されたキー情報を文字領域に送信します。
    this.caret.addEventListener("keydown", (event) => {
      if (event.key === "Tab") {
        event.preventDefault();
      }
      textArea.dispatchEvent(new CustomEvent("custom-presskey", {
        detail: event.key
      }));
    });

    // キャレットの配置位置を更新します。
    this.caret.addEventListener("custom-changefocus", (event) => {
      this.takeCaret();
      setTimeout(() => {
        this.putCaret(event.detail.left, event.detail.top);
      }, 0);
    });
  };
};

export {
  Caret
}
