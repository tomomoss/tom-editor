"use strict";

/**
 * 現在フォーカスしている行の位置を分かりやすくするための装飾下線です。
 * 範囲選択時は表示しないようにします。
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
   * 装飾下線の寸法と座標を調整します。
   * @param {boolean} active 装飾下線を表示するならばtrueが入っています。
   * @param {number} top 装飾下線の垂直座標となる値です。
   * @param {number} width 装飾下線の横幅となる値です。
   */
  adjustDecorationUnderlineRect = (active, top, width) => {
    if (!active) {
      if (this.decorationUnderline.classList.contains("tom-editor__decoration-underline--active")) {
        this.decorationUnderline.classList.remove("tom-editor__decoration-underline--active");
      }
      return;
    }
    this.decorationUnderline.classList.add("tom-editor__decoration-underline--active");
    this.decorationUnderline.style.top = `${top}px`;
    this.decorationUnderline.style.width = `${width - parseFloat(getComputedStyle(this.decorationUnderline).fontSize)}px`;
  };

  /**
   * 装飾下線を生成します。
   * @param {number} left 装飾下線の配置場所となる水平座標です。
   * @returns {HTMLDivElement} 装飾下線です。
   */
  createDecorationUnderline = (left) => {
    const decorationUnderline = document.createElement("div");
    decorationUnderline.classList.add("tom-editor__decoration-underline");
    decorationUnderline.style.left = `${left}px`;
    return decorationUnderline;
  };

  /**
   * イベントリスナーを実装します。
   */
  setEventListeners = () => {

    // キャレットにキー入力があったことで文字領域の状態が変化したので、装飾下線の配置位置と座標も調整します。
    this.decorationUnderline.addEventListener("keydownCaret-textArea", (event) => {
      this.adjustDecorationUnderlineRect(event.detail.active, event.detail.top, event.detail.width);
    });

    // 行番号領域がクリックされたことで文字領域のフォーカス位置が変化したので、
    // 装飾下線を表示状態にするとともに配置位置を調整します。
    this.decorationUnderline.addEventListener("mousedownLineNumberArea-textArea", (event) => {
      this.adjustDecorationUnderlineRect(event.detail.active, event.detail.top, event.detail.width);
    });

    // 文字領域がクリックされたので、装飾下線を表示状態にするとともに配置位置を調整します。
    this.decorationUnderline.addEventListener("mousedownTextArea", (event) => {
      this.adjustDecorationUnderlineRect(event.detail.active, event.detail.top, event.detail.width);
    });

    // 垂直方向のスクロールバー領域がクリックされたことでスクロール処理が実行されて文字領域のフォーカス位置が変化したので、
    // 装飾下線を表示状態にするとともに配置位置を調整します。
    this.decorationUnderline.addEventListener("mousedownVirticalScrollbarArea-textArea", (event) => {
      this.adjustDecorationUnderlineRect(event.detail.active, event.detail.top, event.detail.width);
    });

    // 文字領域のマウスドラッグ操作により文字領域のフォーカス位置が変化したので、
    // 装飾下線を表示状態にするとともに配置位置を調整します。
    this.decorationUnderline.addEventListener("mousemoveEditor-textArea", (event) => {
      this.adjustDecorationUnderlineRect(event.detail.active, event.detail.top, event.detail.width);
    });

    // 垂直方向のスクロールバー領域のマウスドラッグ操作により文字領域のフォーカス位置が変化したので、
    // 装飾下線の配置位置を調整します。
    this.decorationUnderline.addEventListener("mousemoveEditor-virticalScrollbarArea-textArea", (event) => {
      this.adjustDecorationUnderlineRect(event.detail.active, event.detail.top, event.detail.width);
    });

    // エディターの横幅が変化したことで文字領域の横幅も変化したので、装飾下線の横幅を調整します。
    this.decorationUnderline.addEventListener("resizeEditor-textArea", (event) => {
      this.adjustDecorationUnderlineRect(event.detail.active, event.detail.top, event.detail.width);
    });

    // エディターの横幅が変化したことで文字領域の横幅も変化したので、装飾下線の横幅を調整します。
    this.decorationUnderline.addEventListener("wheelLineNumberArea-textArea", (event) => {
      this.adjustDecorationUnderlineRect(event.detail.active, event.detail.top, event.detail.width);
    });

    //
    this.decorationUnderline.addEventListener("wheelTextArea", (event) => {
      this.adjustDecorationUnderlineRect(event.detail.active, event.detail.top, event.detail.width);
    });
  };
};

export {
  DecorationUnderline
}
