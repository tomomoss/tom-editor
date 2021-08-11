"use strict";

/**
 * キャレットです。
 * @param {HTMLDivElement} editor エディター本体です。
 */
const Caret = class {
  constructor(editor) {
    Object.seal(this);
    this.editor = editor;
    this.caret = this.createCaret();
    this.editor.appendChild(this.caret);
    this.setEventListeners();
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
   */
  setEventListeners = () => {

    // キャレットからフォーカスが外れたことを文字領域に通知します。。
    this.caret.addEventListener("blur", () => {
      this.editor.dispatchEvent(new CustomEvent("custom-blur"));
    });

    // キーが入力されてもキャレットですることはほとんどありません。
    // せいぜいTabキーによるフォーカス位置の変更やCtrlキーを同時押ししてのショートカット処理などの既定の動作を中止すること。
    // 押されたキーを発信することぐらいです。
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
  };
};

export {
  Caret
}
