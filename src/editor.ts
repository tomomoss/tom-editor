/**
 * エディター本体、およびエディター外要素を制御します。
 * @param {Main} root ライブラリのエントリポイントです。
 * @param {boolean} readonlyFlag 読みとり専用状態ならばtrueが入ります。
 * @param {HTMLElement} editorContainer エディター実装対象となるHTML要素です。
 */
const Editor = class {
  constructor(root: Main, readonlyFlag: boolean, editorContainer: HTMLElement) {
    this.root = root;
    this.readonlyFlag = readonlyFlag;
    this.lastTouchLeft = null;
    this.lastTouchTop = null;
    this.styleClass = {
      editor: {
        element: "tom-editor__editor"
      },
      editorWrapper: {
        element: "tom-editor__editor-wrapper"
      }
    };
    this.editorWrapper = this.createEditorWrapper();
    editorContainer.appendChild(this.editorWrapper);
    this.editor = this.createEditor();
    this.editorWrapper.appendChild(this.editor);
    this.constantScrollSize = parseFloat(getComputedStyle(this.editor).lineHeight) * 3.5;
    this.definePublishingEventListeners();
    this.defineSubscribingEventListeners();
  }

  /** @type {number} マウスホイール操作、あるいはクリック操作によるスクロールの基準となる量です。 */
  constantScrollSize: number;

  /** @type {HTMLDivElement} エディター本体です。 */
  editor: HTMLDivElement;

  /** @type {HTMLDivElement} エディター本体のラッパー要素です。 */
  editorWrapper: HTMLDivElement;

  /** @type {HTMLDivElement} 水平スクロールバー領域です。 */
  horizontalScrollbarArea!: HTMLDivElement;

  // タッチ操作で最後に検知された水平座標です。
  lastTouchLeft: number | null;

  // タッチ操作で最後に検知された垂直座標です。
  lastTouchTop: number | null;

  /** @type {boolean} 読みとり専用状態ならばtrueが入ります。 */
  readonlyFlag: boolean;

  /** @type {Main} ライブラリのエントリポイントです。 */
  root: Main;

  /** @type {EditorStyleClass} 当クラスで使用するCSSクラスをまとめたオブジェクトです。 */
  styleClass: EditorStyleClass;

  /**
   * エディター本体を生成します。
   * @returns {HTMLDivElement} エディター本体です。
   */
  createEditor = (): HTMLDivElement => {
    const editor = document.createElement("div");
    editor.classList.add(this.styleClass.editor.element);
    return editor;
  };

  /**
   * エディター本体のラッパー要素を生成します。
   * @returns {HTMLDivElement} エディター本体のラッパー要素です。
   */
  createEditorWrapper = (): HTMLDivElement => {
    const editorWrapper = document.createElement("div");
    editorWrapper.classList.add(this.styleClass.editorWrapper.element);
    return editorWrapper;
  };

  /**
   * 出版用イベントリスナーを定義します。
   */
  definePublishingEventListeners = (): void => {

    // mousedownイベントによってキャレットを配置しようとするとき、
    // どういうわけかmousedownした瞬間にblurしてしまうためmousedownイベントの既定の動作を実行しないようにしています。
    // 各要素に以下処理を実装してもよいのですが面倒くさいのでエディター本体を対象に実装しています。
    this.editor.addEventListener("mousedown", (event): void => {
      event.preventDefault();
    });

    // エディター上でmousemoveイベントが発生したことを通知するだけの役割です。
    this.editor.addEventListener("mousemove", (event): void => {
      if (event.target === null) {
        throw new Error("Editor.prototype.definePublishingEventListeners: mousedownイベントのtargetプロパティが空です。");
      }
      this.root.dispatchEvent(new CustomEvent("TOMEditor-mousemove", {
        detail: {
          left: event.x,
          target: event.target,
          top: event.y
        } as TOMEditorMouseMoveEvent
      }));
    });

    // スワイプ処理のフラグを下ろします。
    this.editor.addEventListener("touchend", (): void => {
      this.lastTouchLeft = null;
      this.lastTouchTop = null;
    });

    // スワイプ処理のフラグが立っているならばスワイプ処理を実行します。
    this.editor.addEventListener("touchmove", (event): void => {
      if (this.lastTouchLeft !== null && event.touches[0].pageX !== this.lastTouchLeft) {
        this.dispatchHorizontalScrollEvent(event.touches[0].pageX - this.lastTouchLeft);
        this.lastTouchLeft = event.touches[0].pageX;
      }
      if (this.lastTouchTop !== null && event.touches[0].pageY !== this.lastTouchTop) {
        this.dispatchVerticalScrollEvent(event.touches[0].pageY - this.lastTouchTop);
        this.lastTouchTop = event.touches[0].pageY;
      }
    });

    // タッチによるドラッグ移動処理のフラグを立てます。
    this.editor.addEventListener("touchstart", (event): void => {
      this.lastTouchLeft = event.touches[0].pageX;
      this.lastTouchTop = event.touches[0].pageY;
    });

    // wheelイベントの発生を検知しましたので、スクロール処理のために必要な値を計算して全体に発信します。
    // 各要素に実装してもよいのですが面倒くさいのでエディター本体を対象としてまとめて実装することにしました。
    this.editor.addEventListener("wheel", (event): void => {
      const scrollSize = Math.sign(event.deltaY) * this.constantScrollSize;

      // イベントの発生個所が水平スクロールバー領域かそうでないかを判定する必要があるのですが、
      // そのために便利なevent.pathプロパティが一部のブラウザで実装されていないため自作します。
      const path: HTMLElement[] = [];
      let checkingTarget = event.target;
      while (checkingTarget !== null) {
        path.push(checkingTarget as HTMLElement);
        checkingTarget = (checkingTarget as HTMLElement).parentElement;
      }

      if (path.includes(this.horizontalScrollbarArea)) {
        this.dispatchHorizontalScrollEvent(scrollSize);
      } else {
        this.dispatchVerticalScrollEvent(scrollSize);
      }
    });

    // 他要素にmouseupイベントが発生したことを通知するだけの役割です。
    window.addEventListener("mouseup", (): void => {
      this.root.dispatchEvent(new CustomEvent("TOMEditor-mouseup"));
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

    // 第1次初期化処理が完了したので、第2次初期化処理を開始します。
    this.root.addEventListener("TOMEditor-firstinitialize", (event: CustomEventInit<TOMEditorFirstInitializeEvent>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("Editor.prototype.defineSubscribingEventListeners: TOMEditor-initializeイベントのdetailプロパティが空です。");
      }
      this.horizontalScrollbarArea = event.detail.horizontalScrollbarArea;
    });

    // 水平スクロールバー領域でmousedownイベントが発生しましたので、whellイベントと同質の水平スクロール処理を実行します。
    this.root.addEventListener("TOMEditor-mousedownhorizontalscrollbararea", (event: CustomEventInit<TOMEditorMouseDownHorizontalScrollbarAreaEvent>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("Editor.prototype.defineSubscribingEventListeners: TOMEditor-mousedownhorizontalscrollbarareaイベントのdetailプロパティが空です。");
      }
      this.dispatchHorizontalScrollEvent(event.detail.scrollDirection * this.constantScrollSize);
    });

    // 垂直スクロールバー領域でmousedownイベントが発生しましたので、whellイベントと同質の垂直スクロール処理を実行します。
    this.root.addEventListener("TOMEditor-mousedownverticalscrollbararea", (event: CustomEventInit<TOMEditorMouseDownVerticalScrollbarAreaEvent>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("Editor.prototype.defineSubscribingEventListeners: TOMEditor-mousedownverticalscrollbarareaイベントのdetailプロパティが空です。");
      }
      this.dispatchVerticalScrollEvent(event.detail.scrollDirection * this.constantScrollSize);
    });

    // 読みとり専用状態にする場合は一部のイベントリスナーの定義を省略します。
    if (this.readonlyFlag) {
      return;
    }
  };

  /**
   * TOMEditor-horizontalscrollイベントを発信します。
   * @param {number} scrollSize スクロール量です。
   */
  dispatchHorizontalScrollEvent = (scrollSize: number): void => {
    this.root.dispatchEvent(new CustomEvent("TOMEditor-horizontalscroll", {
      detail: {
        scrollSize: scrollSize
      } as TOMEditorHorizontalScrollEvent
    }));
  };

  /**
   * TOMEditor-verticalscrollイベントを発信します。
   * @param {number} scrollSize スクロール量です。
   */
  dispatchVerticalScrollEvent = (scrollSize: number): void => {
    this.root.dispatchEvent(new CustomEvent("TOMEditor-verticalscroll", {
      detail: {
        scrollSize: scrollSize
      } as TOMEditorVerticalScrollEvent
    }));
  };
};

export {
  Editor
}
