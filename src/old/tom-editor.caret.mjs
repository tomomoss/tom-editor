"use strict";

/**
 * キャレットです。
 * @param {HTMLDivElement} editor エディター本体です。
 * @param {boolean} readonlyFlag 読みとり専用状態にするならばtrueが入っています。
 */
const Caret = class {
  constructor(editor, readonlyFlag) {
    Object.seal(this);
    this.editor = editor;
    this.caret = this.createCaret();
    this.editor.appendChild(this.caret);
    this.setEventListeners(readonlyFlag);
  }

  /** @type {HTMLDivElement} キャレットです。 */
  caret;

  /** @type {object} 当クラス内で使用するCSSクラスです。 */
  CSSClass = {
    caret: {
      element: "tom-editor__caret",
      modifier: {
        active: "tom-editor__caret--active",
        focus: "tom-editor__caret--focus"
      }
    }
  };

  /** @type {HTMLDivElement} エディター本体です。 */
  editor;

  /**
   * キャレットを生成します。
   * @returns {HTMLDivElement} キャレットです。
   */
  createCaret = () => {
    const caret = document.createElement("textarea");
    caret.classList.add(this.CSSClass.caret.element);
    return caret;
  };

  /**
   * キャレットの配置処理です。
   * @param {number} left 水平座標です。
   * @param {number} top 垂直座標です。
   */
  putCaret = (left, top) => {
    this.caret.classList.add(this.CSSClass.caret.modifier.focus);
    this.caret.style.left = `${left}px`;
    this.caret.style.top = `${top}px`;
    this.caret.focus();

    // キャレットの点滅処理はCSSのKeyframe Animationで実装しており、
    // 当該CSSクラスを適用した瞬間にアニメーションが再生されるようになっています。
    // アニメーションはキャレットに何らかの有効なキー入力があるたびにイチから再生される必要がありますが、
    // 普通にクラスを付けても再生中のアニメーションはそのときの状態のまま流れつづけてしまいます。
    // そこで、非同期処理にするとともに0.05sほど遅延させることで上記の想定どおりの挙動を実現しています。
    this.caret.classList.remove(this.CSSClass.caret.modifier.active);
    setTimeout(() => {
      this.caret.classList.add(this.CSSClass.caret.modifier.active);
    }, 50);
  };

  /**
   * キャレットの除外処理です。
   */
  takeCaret = () => {
    this.caret.classList.remove(this.CSSClass.caret.modifier.active, this.CSSClass.caret.modifier.focus);
  };

  /**
   * イベントリスナーを実装します。
   * @param {boolean} readonlyFlag 読みとり専用状態にするならばtrueが入っています。
   */
  setEventListeners = (readonlyFlag) => {

    // 読みとり専用状態にする場合は一部のイベントリスナーを省略します。
    // 以下、読み取り専用状態時は省略する値やイベントリスナーです。
    if (!readonlyFlag) {

      // キャレットからフォーカスが外れたことを文字領域に通知します。
      this.caret.addEventListener("blur", () => {
        this.editor.dispatchEvent(new CustomEvent("custom-blur"));
      });

      // 変換中の文章を通知します。
      this.caret.addEventListener("input", (event) => {
        this.editor.dispatchEvent(new CustomEvent("custom-input", {
          detail: {
            data: event.data,
            selectionStart: this.caret.selectionStart
          }
        }));
      });

      // 変換セッションの終了と変換結果を通知します。
      this.caret.addEventListener("compositionend", () => {
        this.editor.dispatchEvent(new CustomEvent("custom-compositionend"));
      });

      // 変換セッションの開始を通知します。
      this.caret.addEventListener("compositionstart", () => {
        this.editor.dispatchEvent(new CustomEvent("custom-compositionstart"));
      });

      // 入力されたキー情報を発信します。
      // Tabキーによるフォーカスの移動やCtrlキーとファンクションキーを同時押ししてのショートカット処理といった、
      // ブラウザ標準動作が走ると何が起こるか予想できないのでEvent.preventDefaultメソッドを呼んでおきます。
      this.caret.addEventListener("keydown", (event) => {
        event.preventDefault();
        this.editor.dispatchEvent(new CustomEvent("custom-keydown", {
          detail: {
            ctrlKey: event.ctrlKey,
            key: event.key,
            shiftKey: event.shiftKey
          }
        }));
      });

      // 文字領域でフォーカス位置が変更されたので、変更後の座標にキャレットを移動させます。
      this.editor.addEventListener("custom-moveFocusPoint", (event) => {
        if (event.detail.left === null || event.detail.top === null) {
          this.takeCaret();
          return;
        }
        this.putCaret(event.detail.left, event.detail.top);
      });
    }
  };
};

export {
  Caret
}
