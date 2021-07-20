"use strict";

/**
 * キャレットです。
 */
 const Caret = class {

  /**
   * キャレットを初期化します。
   * @param {Element} superRoot エディター本体を表すHTML要素です。
   */
  constructor(superRoot) {
    Object.seal(this);
    this.root = document.createElement("textarea");
    this.root.style.background = "transparent";
    this.root.style.border = "none";
    this.root.style.color = "transparent";
    this.root.style.display = "none";
    this.root.style.height = superRoot.style.lineHeight;
    this.root.style.left = "0";
    this.root.style.maxWidth = "0.01px";
    this.root.style.outline = "none";
    this.root.style.overflow = "hidden"
    this.root.style.padding = "0";
    this.root.style.position = "absolute";
    this.root.style.resize = "none";
    this.root.style.top = "0";
    superRoot.appendChild(this.root);
  }

  /** @type {Element} 自身（キャレット）を表すHTML要素です。 */
  root;

  /**
   * エディター上からキャレットを取り除きます。
   */
  blurCaret = () => {
    this.root.style.display = "none";
  };

  /**
   * 引数で指定されたHTML要素（文字領域の文字であるはず）にキャレットを移動させます。
   * @param {number} coordinateX 文字領域左上から相対的に求められたキャレットの水平座標です。
   * @param {number} cordinateY 文字領域左上から相対的に求められたキャレットの垂直座標です。
   */
  placeCaret = (coordinateX, cordinateY) => {
    this.root.style.display = "";
    this.root.style.left = `${coordinateX}px`;
    this.root.style.top = `${cordinateY}px`;
    this.startBlinkingAnimation();
    this.root.focus();
  };

  /**
   * キャレットの点滅処理を実装・開始します。
   */
  startBlinkingAnimation = () => {
    this.root.animate([{
      borderLeft: "solid 0.125rem rgb(51, 51, 51)"
    },
    {
      borderLeft: "solid 0.125rem transparent"
    },
    {
      borderLeft: "solid 0.125rem transparent"
    }], {
      duration: 1250,
      easing: "steps(2)",
      fill: "both",
      iterations: Infinity
    });
  };
};

export {
  Caret
}
