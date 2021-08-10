"use strict";

/**
 * キャレットです。
 * @param {HTMLDivElement} editor エディター本体です。
 */
const Caret = class {
  constructor(editor) {
    this.editor = editor;
    this.caret = this.createCaret();
    this.editor.appendChild(this.caret);
    // this.setEventListeners();
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

    // キャレットからフォーカスが外れたときは、キャレットを見えなくします。
    // その後、フォーカスが外れた旨を文字領域と行番号領域に通知します。
    this.caret.addEventListener("blur", () => {
      this.takeCaret();
      this.editor.dispatchEvent(new CustomEvent("caret -> lineNumberArea", {
        detail: {
          index: null
        }
      }));
      this.editor.dispatchEvent(new CustomEvent("caret -> textArea", {
        detail: {
          blur: true
        }
      }));
    });

    // キー入力を検知したら、文字領域に押されたキー情報を通知します。
    this.caret.addEventListener("keydown", (event) => {

      // Tabキーによるフォーカス位置の変更とか、CtrlキーとF5キー同時押しによるスーパーリロードとか、
      // そういったkeydownイベントの標準処理が走らないようにしておきます。 
      event.preventDefault();

      // CtrlキーとShiftキーが押されたときは何もせずに処理から抜けます。
      // なぜなら上記キーが押しっぱなしになっているかどうかはeventオブジェクトから参照できるためで、
      // 上記キーが押されただけでは何もできることがないためです。
      if (event.key === "Ctrl") {
        return;
      }
      if (event.key === "Shift") {
        return;
      }
      this.editor.dispatchEvent(new CustomEvent("caret -> textArea", {
        detail: {
          ctrlKey: event.ctrlKey,
          key: event.key,
          shiftKey: event.shiftKey
        }
      }));
    });

    // 文字領域からの通知です。
    this.editor.addEventListener("textArea -> caret", (event) => {
      this.putCaret(event.detail.left, event.detail.top);
    });
  };
};

export {
  Caret
}
