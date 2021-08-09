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

    // クラスの付け替えによるkeyframesの再実行のために非同期処理にして少しずらしています。
    this.caret.classList.remove("tom-editor__caret--active");
    setTimeout(() => {
      this.caret.classList.add("tom-editor__caret--active");
    }, 50);
  };

  /**
   * キャレットの除外処理です。
   */
  takeCaret = () => {
    this.caret.classList.remove("tom-editor__caret--active", "tom-editor__caret--focus");
  };

  /**
   * イベントリスナーを実装します。
   * @param {HTMLDivElement} lineNumberArea 行番号領域です。
   * @param {HTMLDivElement} textArea 文字領域です。
   */
  setEventListeners = (lineNumberArea, textArea) => {

    // キャレットからフォーカスが外れたときは、キャレットを見えなくします。
    // その後、フォーカスが外れた旨を文字領域と行番号領域に通知します。
    this.caret.addEventListener("blur", () => {
      this.takeCaret();
      textArea.dispatchEvent(new CustomEvent("blurCaret"));
      lineNumberArea.dispatchEvent(new CustomEvent("blurCaret"));
    });

    // キー入力を検知したら、文字領域に押されたキー情報を通知します。
    this.caret.addEventListener("keydown", (event) => {
      event.preventDefault();
      if (event.key === "Ctrl") {
        return;
      }
      if (event.key === "Shift") {
        return;
      }
      textArea.dispatchEvent(new CustomEvent("keydownCaret", {
        detail: {
          ctrlKey: event.ctrlKey,
          key: event.key,
          shiftKey: event.shiftKey
        }
      }));
    });

    // 文字領域に送信したkeydownイベントによって文字領域の内容に変化があったので、
    // 変化後のフォーカス位置にキャレットを動かします。
    this.caret.addEventListener("keydownCaret-textArea", (event) => {
      this.putCaret(event.detail.left, event.detail.top);
    });

    // 文字領域のどこかがクリックされてフォーカス位置が更新されたので、
    // 更新後のフォーカス位置にキャレットを動かします。
    this.caret.addEventListener("mousedownTextArea", (event) => {
      this.putCaret(event.detail.left, event.detail.top);
    });

    // 水平方向のスクロールバー領域の余白がクリックされたことによるスクロール処理が実行されたので、
    // 実行後のフォーカス位置にキャレットを動かします。
    this.caret.addEventListener("mousedownHorizontalScrollbarArea-textArea", (event) => {
      this.putCaret(event.detail.left, event.detail.top);
    });

    // 行番号領域がクリックされたことで1行範囲選択処理が実行されたので、
    // 実行後のフォーカス位置にキャレットを動かします。
    this.caret.addEventListener("mousedownLineNumberArea-textArea", (event) => {
      this.putCaret(event.detail.left, event.detail.top);
    });

    // 垂直方向のスクロールバー領域の余白がクリックされたことによるスクロール処理が実行されたので、
    // 実行後のフォーカス位置にキャレットを動かします。
    this.caret.addEventListener("mousedownVirticalScrollbarArea-textArea", (event) => {
      this.putCaret(event.detail.left, event.detail.top);
    });

    // 水平方向のスクロールバーのドラッグ移動処理が実行されてフォーカス位置の座標が変化したので、
    // 変化後の座標にキャレットを動かします。
    this.caret.addEventListener("mousemoveEditor-horizontalScrollbarArea-textArea", (event) => {
      this.putCaret(event.detail.left, event.detail.top);
    });

    // 垂直方向のスクロールバーのドラッグ移動処理が実行されてフォーカス位置の座標が変化したので、
    // 変化後の座標にキャレットを動かします。
    this.caret.addEventListener("mousemoveEditor-virticalScrollbarArea-textArea", (event) => {
      this.putCaret(event.detail.left, event.detail.top);
    });
    
    // 水平方向のスクロールバー領域でマウスホイールが操作されてフォーカス位置の座標が変化したので、
    // 変化後の座標にキャレットを動かします。
    this.caret.addEventListener("wheelHorizontalScrollbarArea-textArea", (event) => {
      this.putCaret(event.detail.left, event.detail.top);
    });

    // 行番号領域上でマウスホイールが動かされてフォーカス位置の座標が変化したので、
    // 変化後の座標にキャレットを動かします。
    this.caret.addEventListener("wheelLineNumberArea-textArea", (event) => {
      this.putCaret(event.detail.left, event.detail.top);
    });

    // 文字領域上でマウスホイールが動かされてフォーカス位置の座標が変化したので、
    // 変化後の座標にキャレットを動かします。
    this.caret.addEventListener("wheelTextArea", (event) => {
      this.putCaret(event.detail.left, event.detail.top);
    });

    // 垂直方向のスクロールバー領域上でマウスホイールが動かされてフォーカス位置の座標が変化したので、
    // 変化後の座標にキャレットを動かします。
    this.caret.addEventListener("wheelVirticalScrollbarArea-textArea", (event) => {
      this.putCaret(event.detail.left, event.detail.top);
    });
  };
};

export {
  Caret
}
