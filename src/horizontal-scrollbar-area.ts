/**
 * 水平スクロールバー領域を制御します。
 * @param {Main} root ライブラリのエントリポイントです。
 * @param {boolean} readonlyFlag 読みとり専用状態ならばtrueが入ります。
 */
const HorizontalScrollbarArea = class {
  constructor(root: Main, readonlyFlag: boolean) {
    this.root = root;
    this.readonlyFlag = readonlyFlag;
    this.styleClass = {
      horizontalScrollbar: {
        element: "tom-editor__horizontal-scrollbar-area__horizontal-scrollbar",
        modifier: {
          valid: "tom-editor__horizontal-scrollbar-area__horizontal-scrollbar--valid"
        }
      },
      horizontalScrollbarArea: {
        element: "tom-editor__horizontal-scrollbar-area"
      }
    };
    this.horizontalScrollbarArea = this.createHorizontalScrollbarArea();
    this.horizontalScrollbar = this.createHorizontalScrollbar();
    this.horizontalScrollbarArea.appendChild(this.horizontalScrollbar);
    this.defineEventListeners();
  }

  /** @type {boolean} 読みとり専用状態ならばtrueが入ります。 */
  readonlyFlag: boolean;

  /** @type {Main} ライブラリのエントリポイントです。 */
  root: Main;

  /** @type {HorizontalScrollbarAreaStyleClass} 当クラスで使用するCSSクラスをまとめたオブジェクトです。 */
  styleClass: HorizontalScrollbarAreaStyleClass;

  /** @type {HTMLDivElement} 水平スクロールバーです。 */
  horizontalScrollbar: HTMLDivElement;

  /** @type {HTMLDivElement} 水平スクロールバー領域です。 */
  horizontalScrollbarArea: HTMLDivElement;

  /**
   * 水平スクロールバーを生成します。
   * @returns {HTMLDivElement} 水平スクロールバーです。
   */
  createHorizontalScrollbar = (): HTMLDivElement => {
    const horizontalScrollbar = document.createElement("div");
    horizontalScrollbar.classList.add(this.styleClass.horizontalScrollbar.element);
    return horizontalScrollbar;
  };

  /**
   * 水平スクロールバー領域を生成します。
   * @returns {HTMLDivElement} 水平スクロールバー領域です。
   */
  createHorizontalScrollbarArea = (): HTMLDivElement => {
    const horizontalScrollbarArea = document.createElement("div");
    horizontalScrollbarArea.classList.add(this.styleClass.horizontalScrollbarArea.element);
    return horizontalScrollbarArea;
  };

  /**
   * イベントリスナーを定義します。
   */
  defineEventListeners = (): void => {
    this.root.addEventListener("Main-initialize", (event: CustomEventInit<MainInitializeEvent>) => {
      if (typeof event.detail === "undefined") {
        throw new Error("LineNumberArea.prototype.defineEventListeners: Main-initializeイベントの通知内容が不正です。");
      }
      event.detail.editor.appendChild(this.horizontalScrollbarArea);
    });
  };
};

export {
  HorizontalScrollbarArea
}
