"use strict";

/**
 * 垂直スクロールバー領域です。
 * @param {HTMLDivElement} editor エディター本体です。
 * @param {boolean} readonlyFlag 読みとり専用状態にするならばtrueが入っています。
 */
const VirticalScrollbarArea = class {
  constructor(editor, readonlyFlag) {
    Object.seal(this);
    this.editor = editor;
    this.virticalScrollbarArea = this.createVirticalScrollbarArea();
    editor.appendChild(this.virticalScrollbarArea);
    this.virticalScrollbar = this.createVirticalScrollbar();
    this.virticalScrollbarArea.appendChild(this.virticalScrollbar);
    this.setEventListeners(readonlyFlag);
  }

  /** @type {object} 当クラス内で使用するCSSクラスです。 */
  CSSClass = {
    virticalScrollbar: {
      element: "tom-editor__virtical-scrollbar-area__virtical-scrollbar"
    },
    virticalScrollbarArea: {
      element: "tom-editor__virtical-scrollbar-area",
      modifier: {
        active: "tom-editor__virtical-scrollbar-area__virtical-scrollbar--active"
      }
    }
  };

  /** @type {HTMLDivElement} エディター本体です。 */
  editor;

  /** @type {HTMLDivElement} 垂直スクロールバーです。 */
  virticalScrollbar;

  /** @type {HTMLDivElement} 垂直スクロールバー領域です。 */
  virticalScrollbarArea;

  /**
   * 垂直スクロールバーを生成します。
   * @returns {HTMLDivElement} 垂直スクロールバーです。
   */
  createVirticalScrollbar = () => {
    const virticalScrollbar = document.createElement("div");
    virticalScrollbar.classList.add(this.CSSClass.virticalScrollbar.element);
    return virticalScrollbar;
  };

  /**
   * 垂直スクロールバー領域を初期化します。
   * @returns {HTMLDivElement} 垂直スクロールバー領域です。
   */
  createVirticalScrollbarArea = () => {
    const virticalScrollbarArea = document.createElement("div");
    virticalScrollbarArea.classList.add(this.CSSClass.virticalScrollbarArea.element);
    return virticalScrollbarArea;
  };

  /**
   * イベントリスナーを実装します。
   * @param {boolean} readonlyFlag 読みとり専用状態にするならばtrueが入っています。
   */
  setEventListeners = (readonlyFlag) => {

    // マウスホイール操作、および垂直スクロールバー領域の余白をクリックしたときに実行する、
    // 垂直スクロール処理で用いるスクロール量です。
    const absoluteScrollSize = parseFloat(getComputedStyle(this.virticalScrollbarArea).lineHeight) * 3.5;

    // 最後に検知した、文字領域の垂直方向のスクロール量です。
    let lastScrollTop;

    // 最後に検知した、文字領域の実際の高さ（scrollHeight）に対するビューポートの高さ（clientHeight）の割合です。
    let lastViewportHeightRatio;

    // 最後に検知した、垂直スクロールバーのドラッグ操作処理の垂直座標です。
    let lastY = null;

    // スクロールバーがクリックされたときは、ドラッグ移動フラグを起動します。
    this.virticalScrollbar.addEventListener("mousedown", (event) => {
      lastY = event.y;
    });

    // 垂直スクロールバー領域の余白をクリックされたときは、マウスホイール操作と同様に一定量のスクロールを実行します。
    this.virticalScrollbarArea.addEventListener("mousedown", (event) => {

      // 垂直スクロールバーをクリックした場合は処理から抜けます。
      if (event.target === this.virticalScrollbar) {
        return;
      }

      let scrollSize = absoluteScrollSize;
      if (event.y < this.virticalScrollbar.getBoundingClientRect().top) {
        scrollSize *= -1;
      }
      this.editor.dispatchEvent(new CustomEvent("custom-scrollVertically", {
        detail: {
          scrollSize: scrollSize
        }
      }));
    });

    // 文字領域の垂直方向のスクロール量が変化したので、垂直スクロールバーの座標に反映します。
    this.editor.addEventListener("custom-changeTextAreaScrollTop", (event) => {
      lastScrollTop = event.detail.scrollTop;
      if (!this.virticalScrollbar.classList.contains("tom-editor__virtical-scrollbar-area__virtical-scrollbar--active")) {
        return;
      }
      this.virticalScrollbar.style.top = `${lastViewportHeightRatio * lastScrollTop}px`;
    });

    // 文字領域の実際の高さ（scrollHeight）に対するビューポートの高さ（clientHeight）の割合が変化したので、
    // 垂直スクロールバーの縦幅に反映するとともにスクロールバーの表示・非表示の切りかえも行います。
    this.editor.addEventListener("custom-changeTextAreaViewportHeightRatio", (event) => {
      lastViewportHeightRatio = event.detail.viewportHeightRatio;
      if (lastViewportHeightRatio === 1) {
        if (this.virticalScrollbar.classList.contains("tom-editor__virtical-scrollbar-area__virtical-scrollbar--active")) {
          this.virticalScrollbar.classList.remove("tom-editor__virtical-scrollbar-area__virtical-scrollbar--active");
        }
        return;
      }
      this.virticalScrollbar.classList.add("tom-editor__virtical-scrollbar-area__virtical-scrollbar--active");
      this.virticalScrollbar.style.height = `${lastViewportHeightRatio * 100}%`;
    });

    // エディター上でmousemoveイベントが検知されましたので、
    // 垂直スクロールバーのドラッグ操作処理中ならば垂直スクロール処理を実行します。
    this.editor.addEventListener("custom-mousemove", (event) => {
      if (lastY === null) {
        return;
      }
      if (event.detail.y === lastY) {
        return;
      }
      const differenceY = event.detail.y - lastY;
      lastY = event.detail.y;
      this.editor.dispatchEvent(new CustomEvent("custom-scrollVertically", {
        detail: {
          scrollRatio: differenceY
        }
      }));
    });

    // 垂直スクロールバーのドラッグ操作処理を終了します。
    this.editor.addEventListener("custom-mouseup", () => {
      lastY = null;
    });

    // 読みとり専用状態にする場合は一部のイベントリスナーを省略します。
    // 以下、読み取り専用状態時は省略する値やイベントリスナーです。
    if (!readonlyFlag) {

      // ※垂直スクロールバー領域には省略される値やイベントリスナーはありません。
    }
  };
};

export {
  VirticalScrollbarArea
}
