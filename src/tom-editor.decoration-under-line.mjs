"use strict";

/**
 * 装飾下線です。
 * @param {HTMLDivElement} editor エディター本体です。
 * @param {number} left 装飾下線の配置場所となる水平座標です。
 * @param {boolean} readonlyFlag 読みとり専用状態にするならばtrueが入っています。
 */
const DecorationUnderline = class {
  constructor(editor, left, readonlyFlag) {
    Object.seal(this);
    this.editor = editor;
    this.decorationUnderline = this.createDecorationUnderline(left);
    this.editor.appendChild(this.decorationUnderline);
    this.setEventListeners(readonlyFlag);
  }

  /** @type {object} 当クラス内で使用するCSSクラスです。 */
  CSSClass = {
    decorationUnderline: {
      element: "tom-editor__decoration-underline",
      modifier: {
        active: "tom-editor__decoration-underline--active"
      }
    }
  };

  /** @type {HTMLDivElement} 装飾下線です。 */
  decorationUnderline;

  /** @type {HTMLDivElement} エディター本体です。 */
  editor;

  /** @type {null|number} 最後に検知した、フォーカス位置の垂直座標です。 */
  lastFocusPointTop = null;

  /** @type {boolean} 最後に検知した、範囲選択中であるかどうかのフラグです。 */
  lastSelectingRange = false;

  /**
   * 装飾下線の状態を制御します。
   */
  adjustDecorationUnderlineStyle = () => {
    if (this.lastFocusPointTop === null || this.lastSelectingRange) {
      if (this.decorationUnderline.classList.contains(this.CSSClass.decorationUnderline.modifier.active)) {
        this.decorationUnderline.classList.remove(this.CSSClass.decorationUnderline.modifier.active);
      }
      return;
    }
    this.decorationUnderline.classList.add(this.CSSClass.decorationUnderline.modifier.active);
    this.decorationUnderline.style.top = `${this.lastFocusPointTop}px`;
  };

  /**
   * 装飾下線を生成します。
   * @param {number} left 装飾下線の配置場所となる水平座標です。
   * @returns {HTMLDivElement} 装飾下線です。
   */
  createDecorationUnderline = (left) => {
    const decorationUnderline = document.createElement("div");
    decorationUnderline.classList.add(this.CSSClass.decorationUnderline.element);
    decorationUnderline.style.left = `${left}px`;
    return decorationUnderline;
  };

  /**
   * イベントリスナーを実装します。
   * @param {boolean} readonlyFlag 読みとり専用状態にするならばtrueが入っています。
   */
  setEventListeners = (readonlyFlag) => {

    // 読みとり専用状態にする場合は一部のイベントリスナーを省略します。
    // 以下、読み取り専用状態時は省略する値やイベントリスナーです。
    if (!readonlyFlag) {

      // 装飾下線と垂直スクロールバー領域との間にもうける隙間の大きさです。
      // これがないとピッタリくっついてしまい、なんだか窮屈な感じになってしまいます。
      const decorationUnderlineGapSize = parseFloat(getComputedStyle(this.editor).fontSize) * 0.5;

      // 範囲選択中は装飾下線を表示しません。
      this.editor.addEventListener("custom-changeSelectingRange", (event) => {
        this.lastSelectingRange = event.detail.selectingRange;
        this.adjustDecorationUnderlineStyle();
      });

      // 文字領域でフォーカス位置が変更されたので、変更後の座標に装飾下線を移動させます。
      this.editor.addEventListener("custom-moveFocusPoint", (event) => {
        this.lastFocusPointTop = event.detail.top;
        this.adjustDecorationUnderlineStyle();
      });

      // 文字領域の横幅が変化したので、装飾下線の横幅も合わせます。
      this.editor.addEventListener("custom-resizeTextAreaWidth", (event) => {
        this.decorationUnderline.style.width = `${event.detail.width - decorationUnderlineGapSize}px`;
      });
    }
  };
};

export {
  DecorationUnderline
}
