"use strict";

/**
 * 水平スクロールバー領域です。
 * @param {HTMLDivElement} editor エディター本体です。
 * @param {number} left 当領域の配置場所となる水平座標です。
 * @param {boolean} readonlyFlag 読みとり専用状態にするならばtrueが入っています。
 */
const HorizontalScrollbarArea = class {
  constructor(editor, left, readonlyFlag) {
    Object.seal(this);
    this.editor = editor;
    this.horizontalScrollbarArea = this.createHorizontalScrollbarArea(left);
    this.editor.appendChild(this.horizontalScrollbarArea);
    this.horizontalScrollbar = this.createHorizontalScrollbar();
    this.horizontalScrollbarArea.appendChild(this.horizontalScrollbar);
    this.setEventListeners(readonlyFlag);
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
   * @param {boolean} readonlyFlag 読みとり専用状態にするならばtrueが入っています。
   */
  setEventListeners = (readonlyFlag) => {

    // 読みとり専用状態にする場合は一部のイベントリスナーを省略します。
    // 以下、読み取り専用状態時は省略する値やイベントリスナーです。
    if (!readonlyFlag) {

      // 水平スクロールバー領域には省略される値やイベントリスナーはありません。
    }

    // スクロール量です。
    const absoluteScrollSize = parseFloat(getComputedStyle(this.editor).lineHeight) * 3.5;

    // 最後に検知した、文字領域の水平方向のスクロール量です。
    let lastScrollLeft;

    // 最後に検知した、文字領域の実際の横幅（scrollWidth）に対するビューポートの横幅（clientWidth）の割合です。
    let lastViewportWidthRatio;

    // 最後に検知した、水平スクロールバーのドラッグ操作処理の水平座標です。
    let lastX = null;

    // スクロールバーがクリックされたときは、ドラッグ移動フラグを起動します。
    this.horizontalScrollbar.addEventListener("mousedown", (event) => {
      lastX = event.x;
    });

    // 水平スクロールバー領域の余白をクリックされたときは、マウスホイール操作と同様に一定量のスクロールを実行します。
    this.horizontalScrollbarArea.addEventListener("mousedown", (event) => {

      // 水平スクロールバーをクリックした場合は処理から抜けます。
      if (event.target === this.horizontalScrollbar) {
        return;
      }

      let scrollSize = absoluteScrollSize;
      if (event.x < this.horizontalScrollbar.getBoundingClientRect().left) {
        scrollSize *= -1;
      }
      this.editor.dispatchEvent(new CustomEvent("custom-scrollHorizontally", {
        detail: {
          scrollSize: scrollSize
        }
      }));
    });

    //　文字領域の水平方向のスクロール量が変化したので、水平スクロールバーの座標に反映します。
    this.editor.addEventListener("custom-changeTextAreaScrollLeft", (event) => {
      if (event.detail.scrollLeft === lastScrollLeft) {
        return;
      }
      lastScrollLeft = event.detail.scrollLeft;
      this.horizontalScrollbar.style.left = `${lastViewportWidthRatio * lastScrollLeft}px`;
    });

    // 文字領域の実際の横幅（scrollWidth）に対するビューポートの横幅（clientWidth）の割合が変化したので、
    // 水平スクロールバーの縦幅に反映するとともに水平スクロールバー領域の表示・非表示の切りかえも行います。
    this.editor.addEventListener("custom-changeTextAreaViewportWidthRatio", (event) => {
      if (event.detail.viewportWidthRatio === lastViewportWidthRatio) {
        return;
      }
      lastViewportWidthRatio = event.detail.viewportWidthRatio;
      if (lastViewportWidthRatio === 1) {
        if (this.horizontalScrollbarArea.classList.contains(this.CSSClass.horizontalScrollbarArea.modifier.active)) {
          this.horizontalScrollbarArea.classList.remove(this.CSSClass.horizontalScrollbarArea.modifier.active);
        }
        return;
      }
      this.horizontalScrollbarArea.classList.add(this.CSSClass.horizontalScrollbarArea.modifier.active);
      this.horizontalScrollbar.style.width = `${lastViewportWidthRatio * 100}%`;
    });

    // エディター上でmousemoveイベントが検知されましたので、
    // 垂直スクロールバーのドラッグ操作処理中ならば垂直スクロール処理を実行します。
    this.editor.addEventListener("custom-mousemove", (event) => {
      if (lastX === null) {
        return;
      }
      if (event.detail.x === lastX) {
        return;
      }
      const differenceX = event.detail.x - lastX;
      lastX = event.detail.x;
      this.editor.dispatchEvent(new CustomEvent("custom-scrollHorizontally", {
        detail: {
          scrollSize: differenceX / this.horizontalScrollbarArea.clientWidth * (this.horizontalScrollbarArea.clientWidth + this.horizontalScrollbarArea.clientWidth * lastViewportWidthRatio)
        }
      }));
    });

    // 水平スクロールバーのドラッグ操作処理を終了します。
    this.editor.addEventListener("custom-mouseup", () => {
      lastX = null;
    });

    // エディターの横幅が変更されたことで文字領域の横幅が変更されたので、当領域の横幅を合わせます。
    this.editor.addEventListener("custom-resizeTextAreaWidth", (event) => {
      this.horizontalScrollbarArea.style.width = `${event.detail.width}px`;
    });
  };
};

export {
  HorizontalScrollbarArea
}
