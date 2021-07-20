"use strict";

/**
 * 現在フォーカスしている行の位置を分かりやすくするための装飾線です。
 */
const DecorationUnderLine = class {

  /**
   * 装飾下線を初期化します。
   * @param {Element} superRoot エディター本体を表すHTML要素です。
   * @param {number} lineNumberAreaWidth 行番号領域の横幅です。
   * @param {number} virticalScrollbarAreaWidth 水平方向のスクロールバー領域の横幅です。
   */
  constructor(superRoot, lineNumberAreaWidth, virticalScrollbarAreaWidth) {
    Object.seal(this);
    this.root = document.createElement("div");
    this.root.style.borderBottom = "solid 0.1rem rgb(238, 238, 238)";
    this.root.style.cursor = "default";
    this.root.style.display = "none";
    this.root.style.height = "0";
    this.root.style.left = `${lineNumberAreaWidth}px`;
    this.root.style.margin = "0 0.5rem 0 0";
    this.root.style.position = "absolute";
    this.root.style.right = `${virticalScrollbarAreaWidth}px`;
    superRoot.appendChild(this.root);
  }

  /** @type {Element} 自身（装飾下線）を表すHTML要素です。 */
  root;



  /**
   * エディター上から装飾下線を取り除きます。
   */
  blurDecorationUnderLine = () => {
    this.root.style.display = "none";
  };

  /**
   * 引数で指定された文字領域の列に装飾下線を移動させます。
   * @param {number} cordinateY 装飾下線を配置する垂直座標です。
   */
  placeDecorationUnderLine = (cordinateY) => {
    this.root.style.display = "";
    this.root.style.top = `${cordinateY + parseFloat(getComputedStyle(this.root).lineHeight)}px`;
  };
};

export {
  DecorationUnderLine
}
