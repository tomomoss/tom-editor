"use strict";

/**
 * 垂直方向のスクロールバー領域です。
 */
const VirticalScrollbarArea = class {

  /**
   * 垂直方向のスクロールバー領域を初期化します。
   * @param {HTMLDivElement} editor エディター本体です。
   */
  constructor(editor) {
    this.virticalScrollbarArea = this.createVirticalScrollbarArea();
    editor.appendChild(this.virticalScrollbarArea);
    this.virticalScrollbar = this.createVirticalScrollbar();
    this.virticalScrollbarArea.appendChild(this.virticalScrollbar);
  }

  /** @type {number} 最後に検知された垂直方向のスクロールバー領域の横幅です。 */
  lastVirticalScrollbarAreaHeight = null;

  /** @type {boolean|null} スクロールバーの移動処理実行中は垂直座標が入ります。 */
  lastY = null;

  /** @type {HTMLDivElement} 垂直方向のスクロールバーです。 */
  virticalScrollbar = null;

  /** @type {HTMLDivElement} 垂直方向のスクロールバー領域です。 */
  virticalScrollbarArea = null;

  /**
   * 垂直方向のスクロールバーの寸法と位置を調整します。
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
   * 垂直方向のスクロールバーを生成します。
   * @returns {HTMLDivElement} 垂直方向のスクロールバーです。
   */
  createVirticalScrollbar = () => {
    const virticalScrollbar = document.createElement("div");
    virticalScrollbar.classList.add("tom-editor__virtical-scrollbar-area__virtical-scrollbar");
    return virticalScrollbar;
  };

  /**
   * 垂直方向のスクロールバー領域を初期化します。
   * @returns {HTMLDivElement} 垂直方向のスクロールバー領域です。
   */
  createVirticalScrollbarArea = () => {
    const virticalScrollbarArea = document.createElement("div");
    virticalScrollbarArea.classList.add("tom-editor__virtical-scrollbar-area");
    return virticalScrollbarArea;
  };

  /**
   * イベントリスナーを実装します。
   * @param {HTMLDivElement} lineNumberArea 行番号領域です。
   * @param {HTMLDivElement} textArea 文字領域です。
   */
  setEventListeners = (lineNumberArea, textArea) => {

    // エディターの縦幅が変更されたとき――当領域の縦幅が変更されたときは、
    // スクロールバーの寸法や位置を更新します。
    new ResizeObserver(() => {
      const virticalScrollbarAreaHeight = this.virticalScrollbarArea.getBoundingClientRect().height;
      if (virticalScrollbarAreaHeight === this.lastVirticalScrollbarAreaHeight) {
        return;
      }
      this.lastVirticalScrollbarAreaHeight = virticalScrollbarAreaHeight;
      textArea.dispatchEvent(new CustomEvent("resizeVirticalScrollbarArea"));
    }).observe(this.virticalScrollbarArea);

    // スクロールバーがクリックされたときは、ドラッグ移動フラグを起動します。
    this.virticalScrollbar.addEventListener("mousedown", (event) => {
      this.lastY = event.y;
    });

    // キャレットに有効なキーが入力されて文字領域の寸法とスクロール量に変化があったので、
    // それら値に合わせてこちらのスクロールバーの寸法と位置を更新します。
    this.virticalScrollbarArea.addEventListener("keydownCaret-textArea", (event) => {
      this.adjustVirticalScrollbarRect(event.detail.clientHeight, event.detail.scrollHeight, event.detail.scrollTop);
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
      lineNumberArea.dispatchEvent(new CustomEvent("mousedownVirticalScrollbarArea", {
        detail: {
          scrollSize: scrollSize
        }
      }));
      textArea.dispatchEvent(new CustomEvent("mousedownVirticalScrollbarArea", {
        detail: {
          scrollSize: scrollSize
        }
      }));
    });

    // 行番号領域がクリックされたことで1行範囲選択処理が実行されたので、
    // 変化後の状態に合わせてこちらのスクロールバーの位置を更新します。
    this.virticalScrollbarArea.addEventListener("mousedownLineNumberArea-textArea", (event) => {
      this.adjustVirticalScrollbarRect(event.detail.clientHeight, event.detail.scrollHeight, event.detail.scrollTop);
    });

    // 文字領域がクリックされたことでスクロール位置が変化したので、変化後のフォーカス位置に合わせてスクロールバーの位置を更新します。
    this.virticalScrollbarArea.addEventListener("mousedownTextArea", (event) => {
      this.adjustVirticalScrollbarRect(event.detail.clientHeight, event.detail.scrollHeight, event.detail.scrollTop);
    });

    // 当領域の余白がクリックされたことによるスクロール処理によって文字領域のスクロール量に変化があったので、
    // 変化後の状態に合わせてこちらのスクロールバーの位置を更新します。
    this.virticalScrollbarArea.addEventListener("mousedownVirticalScrollbarArea-textArea", (event) => {
      this.adjustVirticalScrollbarRect(event.detail.clientHeight, event.detail.scrollHeight, event.detail.scrollTop);
    });

    // エディター上でmousemoveイベントが検知されたとき、スクロールバーのドラッグ移動処理を実行します。
    // 移動した量を割合として算出し、その分だけ文字領域をスクロールさせます。
    this.virticalScrollbarArea.addEventListener("mousemoveEditor", (event) => {
      if (this.lastY === null) {
        return;
      }
      const differenceY = event.detail.y - this.lastY;
      this.lastY = event.detail.y;
      const scrollRatio = differenceY / this.virticalScrollbarArea.getBoundingClientRect().height;
      lineNumberArea.dispatchEvent(new CustomEvent("mousemoveEditor-virticalScrollbarArea", {
        detail: {
          scrollRatio: scrollRatio
        }
      }));
      textArea.dispatchEvent(new CustomEvent("mousemoveEditor-virticalScrollbarArea", {
        detail: {
          scrollRatio: scrollRatio
        }
      }));
    });

    // 文字領域でドラッグ操作が生じたことによって文字領域のスクロール量に変化があったので、
    // 変化後の状態に合わせてこちらのスクロールバーの位置を更新します。
    this.virticalScrollbarArea.addEventListener("mousemoveEditor-textArea", (event) => {
      this.adjustVirticalScrollbarRect(event.detail.clientHeight, event.detail.scrollHeight, event.detail.scrollTop);
    });

    // 当スクロールバーの移動処理によって文字領域のスクロール量に変化があったので、
    // 変化後の状態に合わせてこちらのスクロールバーの位置を更新します。
    this.virticalScrollbarArea.addEventListener("mousemoveEditor-virticalScrollbarArea-textArea", (event) => {
      this.adjustVirticalScrollbarRect(event.detail.clientHeight, event.detail.scrollHeight, event.detail.scrollTop);
    });

    // ウィンドウ上でmouseupイベントが検知されたとき、スクロールバーのドラッグ移動処理を終了します。
    this.virticalScrollbarArea.addEventListener("mouseupWindow", () => {
      this.lastY = null;
    });

    // エディターの縦幅が変更されたとき――当領域の縦幅が変更されたことで文字領域の縦幅が変わったので、
    // スクロールバーの寸法や位置を更新します。
    this.virticalScrollbarArea.addEventListener("resizeVirticalScrollbarArea-textArea", (event) => {
      this.adjustVirticalScrollbarRect(event.detail.clientHeight, event.detail.scrollHeight, event.detail.scrollTop);
    });

    // 垂直方向のスクロールバー領域上でマウスホイールが操作されたのでスクロール処理を実行します。
    this.virticalScrollbarArea.addEventListener("wheel", (event) => {
      const scrollSize = Math.sign(event.deltaY) * parseFloat(getComputedStyle(this.virticalScrollbarArea).fontSize) * 3;
      lineNumberArea.dispatchEvent(new CustomEvent("wheelVirticalScrollbarArea", {
        detail: {
          scrollSize: scrollSize
        }
      }));
      textArea.dispatchEvent(new CustomEvent("wheelVirticalScrollbarArea", {
        detail: {
          scrollSize: scrollSize
        }
      }));
    });

    // 行番号領域上でホイールが回されて文字領域のスクロール量に変化があったので、
    // 変化後の状態に合わせてこちらのスクロールバーの位置を更新します。
    this.virticalScrollbarArea.addEventListener("wheelLineNumberArea-textArea", (event) => {
      this.adjustVirticalScrollbarRect(event.detail.clientHeight, event.detail.scrollHeight, event.detail.scrollTop);
    });

    // 文字領域上でホイールが回されて文字領域のスクロール量に変化があったので、
    // 変化後の状態に合わせてこちらのスクロールバーの位置を更新します。
    this.virticalScrollbarArea.addEventListener("wheelTextArea", (event) => {
      this.adjustVirticalScrollbarRect(event.detail.clientHeight, event.detail.scrollHeight, event.detail.scrollTop);
    });

    // 垂直方向のスクロールバー領域上でホイールが回されて文字領域のスクロール量に変化があったので、
    // 変化後の状態に合わせてこちらのスクロールバーの位置を更新します。
    this.virticalScrollbarArea.addEventListener("wheelVirticalScrollbarArea-textArea", (event) => {
      this.adjustVirticalScrollbarRect(event.detail.clientHeight, event.detail.scrollHeight, event.detail.scrollTop);
    });
  };
};

export {
  VirticalScrollbarArea
}
