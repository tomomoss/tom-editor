"use strict";

/**
 * 水平方向のスクロールバー領域です。
 */
const HorizontalScrollbarArea = class {

  /**
   * 水平方向のスクロールバー領域を初期化します。
   * @param {HTMLDivElement} editor エディター本体です。
   * @param {number} left 当領域の配置場所となる水平座標です。
   */
  constructor(editor, left) {
    this.horizontalScrollbarArea = this.createHorizontalScrollbarArea(left);
    editor.appendChild(this.horizontalScrollbarArea);
    this.horizontalScrollbar = this.createHorizontalScrollbar();
    this.horizontalScrollbarArea.appendChild(this.horizontalScrollbar);
  }

  /** @type {HTMLDivElement} 水平方向のスクロールバーです。 */
  horizontalScrollbar = null;

  /** @type {HTMLDivElement} 水平方向のスクロールバー領域です。 */
  horizontalScrollbarArea = null;

  /**
   * 水平方向のスクロールバーの座標と寸法を調整します。
   * @param {number} textAreaClientWidth 文字領域の見た目の横幅です。
   * @param {number} textAreaScrollWidth 文字領域の実際の横幅です。
   * @param {number} textAreaScrollLeft 文字領域の水平方向のスクロール量です。
   */
  adjustHorizontalScrollbarRect = (textAreaClientWidth, textAreaScrollWidth, textAreaScrollLeft) => {
    if (textAreaClientWidth === textAreaScrollWidth) {
      if (this.horizontalScrollbarArea.classList.contains("tom-editor__horizontal-scrollbar-area--active")) {
        this.horizontalScrollbarArea.classList.remove("tom-editor__horizontal-scrollbar-area--active");
      }
      return;
    }
    this.horizontalScrollbarArea.classList.add("tom-editor__horizontal-scrollbar-area--active");
    this.horizontalScrollbar.style.left = `${textAreaClientWidth / textAreaScrollWidth * textAreaScrollLeft}px`;
    this.horizontalScrollbar.style.width = `${textAreaClientWidth / textAreaScrollWidth * 100}%`;
  };

  /**
   * 水平方向のスクロールバー領域の横幅を調整します。
   * @param {number} textAreaWidth 文字領域の横幅です。
   */
  adjustHorizontalScrollbarAreaWidth = (textAreaWidth) => {
    this.horizontalScrollbarArea.style.width = `${textAreaWidth}px`;
  };

  /**
   * 水平方向のスクロールバーを生成します。
   * @returns {HTMLDivElement} 水平方向のスクロールバーです。
   */
  createHorizontalScrollbar = () => {
    const horizontalScrollbar = document.createElement("div");
    horizontalScrollbar.classList.add("tom-editor__horizontal-scrollbar-area__horizontal-scrollbar");
    return horizontalScrollbar;
  };

  /**
   * 水平方向のスクロールバー領域を生成します。
   * @param {number} left 当領域の配置場所となる水平座標です。
   * @returns {HTMLDivElement} 水平方向のスクロールバー領域です。
   */
  createHorizontalScrollbarArea = (left) => {
    const horizontalScrollbarArea = document.createElement("div");
    horizontalScrollbarArea.classList.add("tom-editor__horizontal-scrollbar-area");
    horizontalScrollbarArea.style.left = `${left}px`;
    return horizontalScrollbarArea;
  };

  /**
   * イベントリスナーを実装します。
   * @param {HTMLDivElement} textArea 文字領域です。
   */
  setEventListeners = (textArea) => {

    // キャレットに有効なキーが入力されて文字領域の寸法とスクロール量に変化があったので、
    // それら値に合わせてこちらのスクロールバーの寸法と位置を更新します。
    this.horizontalScrollbarArea.addEventListener("keydownCaret-textArea", (event) => {
      this.adjustHorizontalScrollbarRect(event.detail.clientWidth, event.detail.scrollWidth, event.detail.scrollLeft);
    });

    // 領域上をクリックされたときは、マウスホイール操作と同様に一定量のスクロールを実行します。
    this.horizontalScrollbarArea.addEventListener("mousedown", (event) => {
      if (event.target !== this.horizontalScrollbarArea) {
        return;
      }
      let scrollSize = parseFloat(getComputedStyle(this.horizontalScrollbarArea).fontSize) * 3;
      if (event.x < this.horizontalScrollbar.getBoundingClientRect().left) {
        scrollSize *= -1;
      }
      textArea.dispatchEvent(new CustomEvent("mousedownHorizontalScrollbarArea", {
        detail: {
          scrollSize: scrollSize
        }
      }));
    });

    // 当領域の余白がクリックされたことによるスクロール処理によって文字領域のスクロール量に変化があったので、
    // 変化後の状態に合わせてこちらのスクロールバーの位置を更新します。
    this.horizontalScrollbarArea.addEventListener("mousedownHorizontalScrollbarArea-textArea", (event) => {
      this.adjustHorizontalScrollbarRect(event.detail.clientWidth, event.detail.scrollWidth, event.detail.scrollLeft);
    });

    // 文字領域のどこかがクリックされたことでフォーカス位置が変化しましたので、
    // 変化後のフォーカス位置に合わせてスクロールバーの位置を更新します。
    this.horizontalScrollbarArea.addEventListener("mousedownTextArea", (event) => {
      this.adjustHorizontalScrollbarRect(event.detail.clientWidth, event.detail.scrollWidth, event.detail.scrollLeft);
    });

    // エディターの横幅が変更されたことで文字領域の横幅が変更されたので、
    // 当領域の横幅とスクロールバーの寸法・位置も更新します。
    this.horizontalScrollbarArea.addEventListener("resizeEditor-textArea", (event) => {
      this.adjustHorizontalScrollbarAreaWidth(event.detail.clientWidth);
      this.adjustHorizontalScrollbarRect(event.detail.clientWidth, event.detail.scrollWidth, event.detail.scrollLeft);
    });
  };
};

export {
  HorizontalScrollbarArea
}
