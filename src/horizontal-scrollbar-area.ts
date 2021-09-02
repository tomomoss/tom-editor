/**
 * 水平スクロールバー領域を制御します。
 * @param {Main} root ライブラリのエントリポイントです。
 * @param {boolean} readonlyFlag 読みとり専用状態ならばtrueが入ります。
 */
const HorizontalScrollbarArea = class {
  constructor(root: Main, readonlyFlag: boolean) {
    this.root = root;
    this.readonlyFlag = readonlyFlag;
    this.draggingLastLeft = null;
    this.lastScrollLeft = 0;
    this.lastViewportWidthRatio = 1;
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
    this.definePublishingEventListeners();
    this.defineSubscribingEventListeners();
  }

  /** @type {number | null} 最後に検知した、水平スクロールバードラッグ操作処理の水平座標です。 */
  draggingLastLeft: number | null;

  /** @type {number} 最後に検知した、文字領域の水平方向のスクロール量です。 */
  lastScrollLeft: number;

  /** @type {number} 最後に検知した、文字領域の文字領域の実際の横幅に対するビューポートの横幅の割合です。 */
  lastViewportWidthRatio: number;

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
   * 水平スクロールバーのスタイルを調整します。
   */
  adjustHorizontalScrollbarStyle = () => {
    if (this.lastViewportWidthRatio === 1) {
      if (this.horizontalScrollbar.classList.contains(this.styleClass.horizontalScrollbar.modifier.valid)) {
        this.horizontalScrollbar.classList.remove(this.styleClass.horizontalScrollbar.modifier.valid);
      }
      return;
    }
    this.horizontalScrollbar.style.left = `${this.lastScrollLeft * this.lastViewportWidthRatio}px`;
    this.horizontalScrollbar.classList.add(this.styleClass.horizontalScrollbar.modifier.valid);
    this.horizontalScrollbar.style.width = `${this.lastViewportWidthRatio * 100}%`;
  };

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
   * 出版用イベントリスナーを定義します。
   */
  definePublishingEventListeners = (): void => {

    // スクロールバーがクリックされたときは、ドラッグ移動フラグを起動します。
    this.horizontalScrollbar.addEventListener("mousedown", (event): void => {
      this.draggingLastLeft = event.x;
    });

    // 水平スクロールバー領域の余白をクリックされたときは、マウスホイール操作と同様に一定量のスクロールを実行します。
    this.horizontalScrollbarArea.addEventListener("mousedown", (event): void => {

      // 水平スクロールバーをクリックした場合は処理から抜けます。
      if (event.target === this.horizontalScrollbar) {
        return;
      }

      let scrollDirection: number;
      if (event.x < this.horizontalScrollbar.getBoundingClientRect().left) {
        scrollDirection = -1;
      } else {
        scrollDirection = 1;
      }
      this.root.dispatchEvent(new CustomEvent("TOMEditor-mousedownhorizontalscrollbararea", {
        detail: {
          scrollDirection: scrollDirection
        } as TOMEditorMouseDownHorizontalScrollbarAreaEvent
      }));
    });

    // 読みとり専用状態にする場合は一部のイベントリスナーの定義を省略します。
    if (this.readonlyFlag) {
      return;
    }
  };

  /**
   * 購読用イベントリスナーを定義します。
   */
  defineSubscribingEventListeners = (): void => {

    //　文字領域の水平方向のスクロール量が変化したので、水平スクロールバーの座標に反映します。
    this.root.addEventListener("TOMEditor-changetextareascrollleft", (event: CustomEventInit<TOMEditorChangeTextAreaScrollLeft>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("HorizontalScrollbarArea.prototype.defineSubscribingEventListeners: changetextareascrollleftイベントのdetailプロパティが空です。");
      }
      this.lastScrollLeft = event.detail.scrollLeft;
      this.adjustHorizontalScrollbarStyle();
    });

    // 文字領域の実際の横幅に対するビューポートの横幅の割合が変化したので、
    // 水平スクロールバーの縦幅に反映するとともに水平スクロールバーの表示・非表示の切りかえも行います。
    this.root.addEventListener("TOMEditor-changetextareaviewportwidthratio", (event: CustomEventInit<TOMEditorChangeTextAreaViewportWidthRatio>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("HorizontalScrollbarArea.prototype.defineSubscribingEventListeners: changetextareaviewportwidthratioイベントのdetailプロパティが空です。");
      }
      this.lastViewportWidthRatio = event.detail.viewportWidthRatio;
      this.adjustHorizontalScrollbarStyle();
    });

    // 第1次初期化処理を実行します。
    this.root.addEventListener("TOMEditor-firstinitialize", (event: CustomEventInit<TOMEditorFirstInitializeEvent>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("HorizontalScrollbarArea.prototype.defineSubscribingEventListeners: TOMEditor-initializeイベントのdetailプロパティが空です。");
      }
      event.detail.editor.appendChild(this.horizontalScrollbarArea);
    });

    // エディター上でmousemoveイベントが検知されましたので、
    // 垂直スクロールバーのドラッグ操作処理中ならば垂直スクロール処理を実行します。
    this.root.addEventListener("TOMEditor-mousemove", (event: CustomEventInit<TOMEditorMouseMoveEvent>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("HorizontalScrollbarArea.prototype.defineSubscribingEventListeners: TOMEditor-mousemoveイベントのdetailプロパティが空です。");
      }
      if (this.draggingLastLeft === null) {
        return;
      }
      if (event.detail.left === this.draggingLastLeft) {
        return;
      }
      const differenceLeft = event.detail.left - this.draggingLastLeft;
      this.draggingLastLeft = event.detail.left;
      this.root.dispatchEvent(new CustomEvent("TOMEditor-draghorizontalscrollbar", {
        detail: {
          distance: differenceLeft
        } as TOMEditorDragHorizontalScrollbarEvent
      }));
    });

    // 水平スクロールバーのドラッグ操作処理を終了します。
    this.root.addEventListener("TOMEditor-mouseup", (): void => {
      this.draggingLastLeft = null;
    });

    // エディターの横幅が変更されたことで文字領域の横幅が変更されたので、当領域の横幅を合わせます。
    this.root.addEventListener("TOMEditor-resizetextareawidth", (event: CustomEventInit<TOMEditorResizeTextAreaWidth>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("HorizontalScrollbarArea.prototype.defineSubscribingEventListeners: TOMEditor-resizetextareawidthイベントのdetailプロパティが空です。");
      }
      this.horizontalScrollbarArea.style.width = `${event.detail.width}px`;
      this.adjustHorizontalScrollbarStyle();
    });

    // 第2次初期化処理を実行します。
    this.root.addEventListener("TOMEditor-secondinitialize", (event: CustomEventInit<TOMEditorSecondInitializeEvent>) => {
      if (typeof event.detail === "undefined") {
        throw new Error("HorizontalScrollbarArea.prototype.defineSubscribingEventListeners: TOMEditor-secondinitializeイベントのdetailプロパティが空です。");
      }
      this.horizontalScrollbarArea.style.left = `${event.detail.lineNumberAreaWidth}px`;
    });

    // 読みとり専用状態にする場合は一部のイベントリスナーの定義を省略します。
    if (this.readonlyFlag) {
      return;
    }
  };
};

export {
  HorizontalScrollbarArea
}
