"use strict";

/**
 * 垂直スクロールバー領域です。
 * @param {HTMLDivElement} editor エディター本体です。
 */
const VirticalScrollbarArea = class {
  constructor(editor) {
    this.editor = editor;
    this.virticalScrollbarArea = this.createVirticalScrollbarArea();
    editor.appendChild(this.virticalScrollbarArea);
    this.virticalScrollbar = this.createVirticalScrollbar();
    this.virticalScrollbarArea.appendChild(this.virticalScrollbar);
    // this.setEventListeners();
  }

  /** @type {object} 当クラス内で使用するCSSクラスです。 */
  CSSClass = {
    virticalScrollbar: {
      element: "tom-editor__virtical-scrollbar-area__virtical-scrollbar"
    },
    virticalScrollbarArea: {
      element: "tom-editor__virtical-scrollbar-area"
    }
  };

  /** @type {HTMLDivElement} エディター本体です。 */
  editor;

  /** @type {number} 最後に検知された垂直スクロールバー領域の横幅です。 */
  lastVirticalScrollbarAreaHeight;

  /** @type {boolean|null} 垂直スクロールバーの移動処理実行中は垂直座標が入ります。 */
  lastY = null;

  /** @type {HTMLDivElement} 垂直スクロールバーです。 */
  virticalScrollbar;

  /** @type {HTMLDivElement} 垂直スクロールバー領域です。 */
  virticalScrollbarArea;

  /**
   * 垂直スクロールバーの寸法と位置を調整します。
   * @param {number} textAreaClientHeight 文字領域の見た目の高さです。
   * @param {number} textAreaScrollHeight 文字領域の実際の高さです。
   * @param {number} textAreaScrollTop 文字領域の垂直方向のスクロール量です。
   */
  adjustVirticalScrollbarRect = (textAreaClientHeight, textAreaScrollHeight, textAreaScrollTop) => {
    if (textAreaClientHeight === textAreaScrollHeight) {
      this.virticalScrollbar.style.height = 0;
      this.virticalScrollbar.style.top = 0;
      return;
    }
    this.virticalScrollbar.style.height = `${textAreaClientHeight / textAreaScrollHeight * 100}%`;
    this.virticalScrollbar.style.top = `${textAreaScrollTop * textAreaClientHeight / textAreaScrollHeight}px`;
  };

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
   */
  setEventListeners = () => {

    // 垂直スクロールバー領域の縦幅の変更を監視しています。
    // ResizeObserverオブジェクトは縦横問わず寸法の変更に反応するので縦幅が変更されたときのみ処理を走らせます。
    // 文字領域にこのことを通知して、文字領域の寸法とスクロール量を送ってもらうようにします。
    new ResizeObserver(() => {
      if (this.virticalScrollbarArea.clientHeight === this.lastVirticalScrollbarAreaHeight) {
        return;
      }
      this.lastVirticalScrollbarAreaHeight = this.virticalScrollbarArea.clientHeight;
      this.editor.dispatchEvent(new CustomEvent("virticalScrollbarArea -> textArea"));
    }).observe(this.virticalScrollbarArea);

    // スクロールバーがクリックされたときは、ドラッグ移動フラグを起動します。
    this.virticalScrollbar.addEventListener("mousedown", (event) => {
      this.lastY = event.y;
    });

    // 領域上をクリックされたときは、マウスホイール操作と同様に一定量のスクロールを実行します。
    this.virticalScrollbarArea.addEventListener("mousedown", (event) => {
      if (event.target !== this.virticalScrollbarArea) {
        return;
      }
      let scrollSize = parseFloat(getComputedStyle(this.virticalScrollbarArea).fontSize) * 3;
      if (event.y < this.virticalScrollbar.getBoundingClientRect().top) {
        scrollSize *= -1;
      }
      this.editor.dispatchEvent(new CustomEvent("virticalScrollbarArea -> lineNumberArea", {
        detail: {
          scrollSize: scrollSize
        }
      }));
      this.editor.dispatchEvent(new CustomEvent("virticalScrollbarArea -> textArea", {
        detail: {
          scrollSize: scrollSize
        }
      }));
    });

    // 垂直方向のスクロールバー領域上でマウスホイールが操作されたのでスクロール処理を実行します。
    this.virticalScrollbarArea.addEventListener("wheel", (event) => {
      const scrollSize = Math.sign(event.deltaY) * parseFloat(getComputedStyle(this.virticalScrollbarArea).fontSize) * 3;
      this.editor.dispatchEvent(new CustomEvent("virticalScrollbarArea -> lineNumberArea", {
        detail: {
          scrollSize: scrollSize
        }
      }));
      this.editor.dispatchEvent(new CustomEvent("virticalScrollbarArea -> textArea", {
        detail: {
          scrollSize: scrollSize
        }
      }));
    });

    // windowオブジェクトからの通知です。
    this.editor.addEventListener("window -> virticalScrollbarArea", () => {
      this.lastY = null;
    });

    // エディター本体からの通知です。
    this.editor.addEventListener("editor -> virticalScrollbarArea", (event) => {

      // ドラッグ操作処理が終了している場合はここで抜けます。
      if (this.lastY === null) {
        return;
      }

      const differenceY = event.detail.y - this.lastY;
      this.lastY = event.detail.y;
      const scrollRatio = differenceY / this.virticalScrollbarArea.getBoundingClientRect().height;
      this.editor.dispatchEvent(new CustomEvent("virticalScrollbarArea -> lineNumberArea", {
        detail: {
          scrollRatio: scrollRatio
        }
      }));
      this.editor.dispatchEvent(new CustomEvent("virticalScrollbarArea -> textArea", {
        detail: {
          scrollRatio: scrollRatio
        }
      }));
    });

    // 文字領域からの通知です。
    this.editor.addEventListener("textArea -> virticalScrollbarArea", (event) => {
      this.adjustVirticalScrollbarRect(event.detail.clientHeight, event.detail.scrollHeight, event.detail.scrollTop);
    });
  };
};

export {
  VirticalScrollbarArea
}
