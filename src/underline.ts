/**
 * フォーカス位置を強調する下線を制御します。
 * @param {Main} root ライブラリのエントリポイントです。
 * @param {boolean} readonlyFlag 読みとり専用状態ならばtrueが入ります。
 */
const Underline = class {
  constructor(root: Main, readonlyFlag: boolean) {
    this.root = root;
    this.readonlyFlag = readonlyFlag;
    this.lastSelectingRange = false;
    this.lastTop = null;
    this.styleClass = {
      underline: {
        element: "tom-editor__underline",
        modifier: {
          valid: "tom-editor__underline--valid"
        }
      }
    };
    this.underline = this.createUnderline();
    this.definePublishingEventListeners();
    this.defineSubscribingEventListeners();
  }

  /** @type {boolean} 最後に検知した、範囲選択をしているかどうかのフラグです。 */
  lastSelectingRange: boolean;

  /** @type {number | null} 最後に検知した、下線の配置位置となる垂直座標です。 */
  lastTop: number | null;

  /** @type {boolean} 読みとり専用状態ならばtrueが入ります。 */
  readonlyFlag: boolean;

  /** @type {Main} ライブラリのエントリポイントです。 */
  root: Main;

  /** @type {UnderlineStyleClass} 当クラスで使用するCSSクラスをまとめたオブジェクトです。 */
  styleClass: UnderlineStyleClass;

  /** @type {HTMLDivElement} フォーカス位置を強調する下線です。 */
  underline: HTMLDivElement;

  /**
   * フォーカス位置を強調する下線を生成します。
   * @returns {HTMLDivElement} フォーカス位置を強調する下線です。
   */
  createUnderline = (): HTMLDivElement => {
    const underline = document.createElement("div");
    underline.classList.add(this.styleClass.underline.element);
    return underline;
  };

  /**
   * 出版用イベントリスナーを定義します。
   */
  definePublishingEventListeners = (): void => {

    // 読みとり専用状態にする場合は一部のイベントリスナーの定義を省略します。
    if (this.readonlyFlag) {
      return;
    }
  };

  /**
   * 購読用イベントリスナーを定義します。
   */
  defineSubscribingEventListeners = (): void => {

    // 第1次初期化処理を実行します。
    this.root.addEventListener("TOMEditor-firstinitialize", (event: CustomEventInit<TOMEditorFirstInitializeEvent>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("Underline.prototype.defineSubscribingEventListeners: TOMEditor-initializeイベントのdetailプロパティが空です。");
      }
      event.detail.editor.appendChild(this.underline);
    });

    // 第2次初期化処理を実行します。
    this.root.addEventListener("TOMEditor-secondinitialize", (event: CustomEventInit<TOMEditorSecondInitializeEvent>) => {
      if (typeof event.detail === "undefined") {
        throw new Error("Underline.prototype.defineSubscribingEventListeners: TOMEditor-secondinitializeイベントのdetailプロパティが空です。");
      }
      this.underline.style.left = `${event.detail.lineNumberAreaWidth}px`;
    });

    // 読みとり専用状態にする場合は一部のイベントリスナーの定義を省略します。
    if (this.readonlyFlag) {
      return;
    }

    // 選択範囲状態に変化がありましたので、変化にあわせて下線の表示・非表示を切りかえます。
    this.root.addEventListener("TOMEditor-changeselectingrange", (event: CustomEventInit<TOMEditorChangeSelectiingRange>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("Underline.prototype.defineSubscribingEventListeners: TOMEditor-changeselectingrangeイベントのdetailプロパティが空です。");
      }
      this.lastSelectingRange = event.detail.selectingRange;
      if (this.lastSelectingRange || this.lastTop === null) {
        if (this.underline.classList.contains(this.styleClass.underline.modifier.valid)) {
          this.underline.classList.remove(this.styleClass.underline.modifier.valid);
        }
        return;
      }
      this.underline.classList.add(this.styleClass.underline.modifier.valid);
    });

    // フォーカス位置が変更されたので、変更後の座標に下線を移動させます。
    this.root.addEventListener("TOMEditor-movefocuspointposition", (event: CustomEventInit<TOMEditorMoveFocusPointPositionEvent>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("Underline.prototype.defineSubscribingEventListeners: TOMEditor-movefocuspointpositionイベントのdetailプロパティが空です。");
      }
      this.lastTop = event.detail.top;
      if (this.lastTop === null || this.lastSelectingRange) {
        if (this.underline.classList.contains(this.styleClass.underline.modifier.valid)) {
          this.underline.classList.remove(this.styleClass.underline.modifier.valid);
        }
        return;
      }
      this.underline.classList.add(this.styleClass.underline.modifier.valid);
      this.underline.style.top = `${this.lastTop}px`;
    });

    // 文字領域の横幅が変化したので、下線の横幅も合わせます。
    this.root.addEventListener("TOMEditor-resizetextareawidth", (event: CustomEventInit<TOMEditorResizeTextAreaWidth>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("Underline.prototype.defineSubscribingEventListeners: TOMEditor-resizetextareawidthイベントのdetailプロパティが空です。");
      }

      // 装飾下線と垂直スクロールバー領域との間にもうける隙間の大きさです。
      // これがないとピッタリくっついてしまい、なんだか窮屈な感じになってしまいます。
      const underlineGapSize = parseFloat(getComputedStyle(this.underline).fontSize) * 0.5;

      this.underline.style.width = `${event.detail.width - underlineGapSize}px`;
    });
  };
};

export {
  Underline
}
