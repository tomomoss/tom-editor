"use strict";

/**
 * 水平スクロールバー領域です。
 * @param {HTMLDivElement} editor エディター本体です。
 * @param {number} left 当領域の配置場所となる水平座標です。
 */
const HorizontalScrollbarArea = class {
  constructor(editor, left) {
    this.editor = editor;
    this.horizontalScrollbarArea = this.createHorizontalScrollbarArea(left);
    this.editor.appendChild(this.horizontalScrollbarArea);
    this.horizontalScrollbar = this.createHorizontalScrollbar();
    this.horizontalScrollbarArea.appendChild(this.horizontalScrollbar);
    // this.setEventListeners();
  }

  /** @type {object} 当クラス内で使用するCSSクラスです。 */
  CSSClass = {
    horizontalScrollbar: {
      element: "tom-editor__horizontal-scrollbar-area__horizontal-scrollbar"
    },
    horizontalScrollbarArea: {
      element: "tom-editor__horizontal-scrollbar-area",
      modifier: {
        active: "tom-editor__horizontal-scrollbar-area--active"
      }
    }
  };

  /** @type {HTMLDivElement} エディター本体です。 */
  editor;

  /** @type {HTMLDivElement} 水平スクロールバーです。 */
  horizontalScrollbar;

  /** @type {HTMLDivElement} 水平スクロールバー領域です。 */
  horizontalScrollbarArea;

  /** @type {boolean|null} 水平スクロールバーの移動処理実行中は水平座標が入ります。 */
  lastX = null;

  /**
   * 水平方向のスクロールバーの座標と寸法を調整します。
   * @param {number} textAreaClientWidth 文字領域の見た目の横幅です。
   * @param {number} textAreaScrollWidth 文字領域の実際の横幅です。
   * @param {number} textAreaScrollLeft 文字領域の水平方向のスクロール量です。
   */
  adjustHorizontalScrollbarRect = (textAreaClientWidth, textAreaScrollWidth, textAreaScrollLeft) => {
    if (textAreaClientWidth === textAreaScrollWidth) {
      if (this.horizontalScrollbarArea.classList.contains(this.CSSClass.horizontalScrollbarArea.modifier.active)) {
        this.horizontalScrollbarArea.classList.remove(this.CSSClass.horizontalScrollbarArea.modifier.active);
      }
      return;
    }
    this.horizontalScrollbarArea.classList.add(this.CSSClass.horizontalScrollbarArea.modifier.active);
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
   * 水平スクロールバーを生成します。
   * @returns {HTMLDivElement} 水平スクロールバーです。
   */
  createHorizontalScrollbar = () => {
    const horizontalScrollbar = document.createElement("div");
    horizontalScrollbar.classList.add(this.CSSClass.horizontalScrollbar.element);
    return horizontalScrollbar;
  };

  /**
   * 水平スクロールバー領域を生成します。
   * @param {number} left 当領域の配置場所となる水平座標です。
   * @returns {HTMLDivElement} 水平スクロールバー領域です。
   */
  createHorizontalScrollbarArea = (left) => {
    const horizontalScrollbarArea = document.createElement("div");
    horizontalScrollbarArea.classList.add(this.CSSClass.horizontalScrollbarArea.element);
    horizontalScrollbarArea.style.left = `${left}px`;
    return horizontalScrollbarArea;
  };

  /**
   * イベントリスナーを実装します。
   */
  setEventListeners = () => {

    // スクロール処理でのスクロール量です。
    // どちらの方向にスクロールするかによって符号を切りかえてください。
    const scrollSize = parseFloat(getComputedStyle(this.horizontalScrollbarArea).lineHeight) * 3;

    // 水平スクロールバーがクリックされたので、ドラッグ移動フラグを起動します。
    this.horizontalScrollbar.addEventListener("mousedown", (event) => {
      this.lastX = event.x;
    });

    // 水平スクロールバー領域上の余白がクリックされたならば、マウスホイール操作と同様に一定量のスクロールを実行します。
    this.horizontalScrollbarArea.addEventListener("mousedown", (event) => {

      // 水平スクロールバーをクリックした場合は抜けます。
      if (event.target !== this.horizontalScrollbarArea) {
        return;
      }

      let scrollSizeSign;
      if (event.x < this.horizontalScrollbar.getBoundingClientRect().left) {
        scrollSizeSign = -1;
      } else {
        scrollSizeSign = 1;
      }
      this.editor.dispatchEvent(new CustomEvent("horizontalScrollbarArea -> textArea", {
        detail: {
          scrollSize: scrollSizeSign * scrollSize
        }
      }));
    });

    // 水平スクロールバー領域上でマウスホイールが操作されたので、スクロール処理を実行します。
    this.horizontalScrollbarArea.addEventListener("wheel", (event) => {
      this.editor.dispatchEvent(new CustomEvent("horizontalScrollbarArea -> textArea", {
        detail: {
          scrollSize: Math.sign(event.deltaY) * scrollSize
        }
      }));
    });

    // 文字領域からの通知です。
    this.editor.addEventListener("textArea -> horizontalScrollbarArea", (event) => {
      this.adjustHorizontalScrollbarRect(event.detail.clientWidth, event.detail.scrollWidth, event.detail.scrollLeft);
    });




    // エディター上でmousemoveイベントが検知されたとき、スクロールバーのドラッグ移動処理を実行します。
    // 移動した量を割合として算出し、その分だけ文字領域をスクロールさせます。
    this.horizontalScrollbarArea.addEventListener("editor -> horizontalScrollbarArea", (event) => {
      if (this.lastX === null) {
        return;
      }
      const differenceX = event.detail.x - this.lastX;
      this.lastX = event.detail.x;
      const scrollRatio = differenceX / this.horizontalScrollbarArea.getBoundingClientRect().width;
      this.editor.dispatchEvent(new CustomEvent("horizontalScrollbarArea -> textArea", {
        detail: {
          scrollRatio: scrollRatio
        }
      }));
    });

    // ウィンドウ上でmouseupイベントが検知されたとき、スクロールバーのドラッグ移動処理を終了します。
    this.editor.addEventListener("window -> horizontalScrollbarArea", () => {
      this.lastX = null;
    });

    // エディターの横幅が変更されたことで文字領域の横幅が変更されたので、
    // 当領域の横幅とスクロールバーの寸法・位置も更新します。
    this.editor.addEventListener("textArea -> horizontalScrollbarArea", (event) => {
      this.adjustHorizontalScrollbarAreaWidth(event.detail.clientWidth);
      this.adjustHorizontalScrollbarRect(event.detail.clientWidth, event.detail.scrollWidth, event.detail.scrollLeft);
    });
  };
};

export {
  HorizontalScrollbarArea
}
