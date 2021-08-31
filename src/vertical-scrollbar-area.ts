/**
 * 垂直スクロールバー領域を制御します。
 * @param {Main} root ライブラリのエントリポイントです。
 * @param {boolean} readonlyFlag 読みとり専用状態ならばtrueが入ります。
 */
const VerticalScrollbarArea = class {
  constructor(root: Main, readonlyFlag: boolean) {
    this.root = root;
    this.readonlyFlag = readonlyFlag;
    this.styleClass = {
      verticalScrollbar: {
        element: "tom-editor__vertical-scrollbar-area__vertical-scrollbar",
        modifier: {
          valid: "tom-editor__vertical-scrollbar-area__vertical-scrollbar--valid"
        }
      },
      verticalScrollbarArea: {
        element: "tom-editor__vertical-scrollbar-area"
      }
    };
    this.verticalScrollbarArea = this.createVerticalScrollbarArea();
    this.verticalScrollbar = this.createVerticalScrollbar();
    this.verticalScrollbarArea.appendChild(this.verticalScrollbar);
    this.defineEventListeners();
  }

  /** @type {boolean} 読みとり専用状態ならばtrueが入ります。 */
  readonlyFlag: boolean;

  /** @type {Main} ライブラリのエントリポイントです。 */
  root: Main;

  /** @type {VerticalScrollbarAreaStyleClass} 当クラスで使用するCSSクラスをまとめたオブジェクトです。 */
  styleClass: VerticalScrollbarAreaStyleClass;

  /** @type {HTMLDivElement} 垂直スクロールバーです。 */
  verticalScrollbar: HTMLDivElement;

  /** @type {HTMLDivElement} 垂直スクロールバー領域です。 */
  verticalScrollbarArea: HTMLDivElement;

  /**
   * 垂直スクロールバーを生成します。
   * @returns {HTMLDivElement} 垂直スクロールバーです。
   */
  createVerticalScrollbar = (): HTMLDivElement => {
    const verticalScrollbar = document.createElement("div");
    verticalScrollbar.classList.add(this.styleClass.verticalScrollbar.element);
    return verticalScrollbar;
  };

  /**
   * 垂直スクロールバー領域を生成します。
   * @returns {HTMLDivElement} 垂直スクロールバー領域です。
   */
  createVerticalScrollbarArea = (): HTMLDivElement => {
    const verticalScrollbarArea = document.createElement("div");
    verticalScrollbarArea.classList.add(this.styleClass.verticalScrollbarArea.element);
    return verticalScrollbarArea;
  };

  /**
   * イベントリスナーを定義します。
   */
  defineEventListeners = (): void => {
    this.root.addEventListener("Main-initialize", (event: CustomEventInit<MainInitializeEvent>) => {
      if (typeof event.detail === "undefined") {
        throw new Error("LineNumberArea.prototype.defineEventListeners: Main-initializeイベントの通知内容が不正です。");
      }
      event.detail.editor.appendChild(this.verticalScrollbarArea);
    });
  };
};

export {
  VerticalScrollbarArea
}
