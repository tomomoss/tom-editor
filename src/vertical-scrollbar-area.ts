/**
 * 垂直スクロールバー領域を制御します。
 * @param {Main} root ライブラリのエントリポイントです。
 * @param {boolean} readonlyFlag 読みとり専用状態ならばtrueが入ります。
 */
const VerticalScrollbarArea = class {
  constructor(root: Main, readonlyFlag: boolean) {
    this.root = root;
    this.readonlyFlag = readonlyFlag;
    this.draggingLastTop = null;
    this.lastScrollTop = 0;
    this.lastViewportHeightRatio = 1;
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
    this.definePublishingEventListeners();
    this.defineSubscribingEventListeners();
  }

  /** @type {number | null} 最後に検知した、垂直スクロールバードラッグ操作処理の垂直座標です。 */
  draggingLastTop: number | null;

  /** @type {number} 最後に検知した、文字領域の垂直方向のスクロール量です。 */
  lastScrollTop: number;

  /** @type {number} 最後に検知した、文字領域の文字領域の実際の横幅に対するビューポートの縦幅の割合です。 */
  lastViewportHeightRatio: number;

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
   * 垂直スクロールバーのスタイルを調整します。
   */
  adjustVerticalScrollbarStyle = () => {
    if (this.lastViewportHeightRatio === 1) {
      if (this.verticalScrollbar.classList.contains(this.styleClass.verticalScrollbar.modifier.valid)) {
        this.verticalScrollbar.classList.remove(this.styleClass.verticalScrollbar.modifier.valid);
      }
      return;
    }
    this.verticalScrollbar.style.top = `${this.lastScrollTop * this.lastViewportHeightRatio}px`;
    this.verticalScrollbar.classList.add(this.styleClass.verticalScrollbar.modifier.valid);
    this.verticalScrollbar.style.height = `${this.lastViewportHeightRatio * 100}%`;
  };

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
   * 出版用イベントリスナーを定義します。
   */
  definePublishingEventListeners = (): void => {

    // スクロールバーがクリックされたときは、ドラッグ移動フラグを起動します。
    this.verticalScrollbar.addEventListener("mousedown", (event): void => {
      this.draggingLastTop = event.y;
    });

    // 垂直スクロールバー領域の余白をクリックされたときは、マウスホイール操作と同様に一定量のスクロールを実行します。
    this.verticalScrollbarArea.addEventListener("mousedown", (event): void => {

      // 垂直スクロールバーをクリックした場合は処理から抜けます。
      if (event.target === this.verticalScrollbar) {
        return;
      }

      let scrollDirection: number;
      if (event.y < this.verticalScrollbar.getBoundingClientRect().top) {
        scrollDirection = -1;
      } else {
        scrollDirection = 1;
      }
      this.root.dispatchEvent(new CustomEvent("TOMEditor-mousedownverticalscrollbararea", {
        detail: {
          scrollDirection: scrollDirection
        } as TOMEditorMouseDownVerticalScrollbarAreaEvent
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

    //　文字領域の垂直方向のスクロール量が変化したので、垂直スクロールバーの座標に反映します。
    this.root.addEventListener("TOMEditor-changetextareascrolltop", (event: CustomEventInit<TOMEditorChangeTextAreaScrollTop>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("VerticalScrollbarArea.prototype.defineSubscribingEventListeners: changetextareascrolltopイベントのdetailプロパティが空です。");
      }
      this.lastScrollTop = event.detail.scrollTop;
      this.adjustVerticalScrollbarStyle();
    });

    // 文字領域の実際の縦幅に対するビューポートの縦幅の割合が変化したので、
    // 垂直スクロールバーの縦幅に反映するとともに垂直スクロールバーの表示・非表示の切りかえも行います。
    this.root.addEventListener("TOMEditor-changetextareaviewportheightratio", (event: CustomEventInit<TOMEditorChangeTextAreaViewportHeightRatio>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("VerticalScrollbarArea.prototype.defineSubscribingEventListeners: changetextareaviewportheightratioイベントのdetailプロパティが空です。");
      }
      this.lastViewportHeightRatio = event.detail.viewportHeightRatio;
      this.adjustVerticalScrollbarStyle();
    });

    // 第1次初期化処理を実行します。
    this.root.addEventListener("TOMEditor-firstinitialize", (event: CustomEventInit<TOMEditorFirstInitializeEvent>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("VerticalScrollbarArea.prototype.defineSubscribingEventListeners: TOMEditor-initializeイベントのdetailプロパティが空です。");
      }
      event.detail.editor.appendChild(this.verticalScrollbarArea);
    });

    // エディター上でmousemoveイベントが検知されましたので、
    // 垂直スクロールバーのドラッグ操作処理中ならば垂直スクロール処理を実行します。
    this.root.addEventListener("TOMEditor-mousemove", (event: CustomEventInit<TOMEditorMouseMoveEvent>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("VerticalScrollbarArea.prototype.defineSubscribingEventListeners: TOMEditor-mousemoveイベントのdetailプロパティが空です。");
      }
      if (this.draggingLastTop === null) {
        return;
      }
      if (event.detail.top === this.draggingLastTop) {
        return;
      }
      const differenceTop = event.detail.top - this.draggingLastTop;
      this.draggingLastTop = event.detail.top;
      this.root.dispatchEvent(new CustomEvent("TOMEditor-dragverticalscrollbar", {
        detail: {
          distance: differenceTop
        } as TOMEditorDragVerticalScrollbarEvent
      }));
    });

    // 垂直スクロールバーのドラッグ操作処理を終了します。
    this.root.addEventListener("TOMEditor-mouseup", (): void => {
      this.draggingLastTop = null;
    });

    // 読みとり専用状態にする場合は一部のイベントリスナーの定義を省略します。
    if (this.readonlyFlag) {
      return;
    }
  };
};

export {
  VerticalScrollbarArea
}
