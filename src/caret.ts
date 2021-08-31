/**
 * キャレットを制御します。
 * @param {Main} root ライブラリのエントリポイントです。
 * @param {boolean} readonlyFlag 読みとり専用状態ならばtrueが入ります。
 */
const Caret = class {
  constructor(root: Main, readonlyFlag: boolean) {
    this.root = root;
    this.readonlyFlag = readonlyFlag;
    this.styleClass = {
      caret: {
        element: "tom-editor__caret",
        modifier: {
          animation: "tom-editor__caret--animation",
          focus: "tom-editor__caret--focus"
        }
      }
    };
    this.caret = this.createCaret();
    this.defineEventListeners();
  }

  /** @type {HTMLTextAreaElement} キャレットです。 */
  caret: HTMLTextAreaElement;

  /** @type {boolean} 読みとり専用状態ならばtrueが入ります。 */
  readonlyFlag: boolean;

  /** @type {Main} ライブラリのエントリポイントです。 */
  root: Main;

  /** @type {CaretStyleClass} 当クラスで使用するCSSクラスをまとめたオブジェクトです。 */
  styleClass: CaretStyleClass;

  /**
   * キャレットを生成します。
   * @returns {HTMLTextAreaElement} キャレットです。
   */
  createCaret = (): HTMLTextAreaElement => {
    const caret = document.createElement("textarea");
    caret.classList.add(this.styleClass.caret.element);
    return caret;
  };

  /**
   * イベントリスナーを定義します。
   */
  defineEventListeners = (): void => {
    this.root.addEventListener("Main-initialize", (event: CustomEventInit<MainInitializeEvent>) => {
      if (typeof event.detail === "undefined") {
        throw new Error("LineNumberArea.prototype.defineEventListeners: Main-initializeイベントの通知内容が不正です。");
      }
      event.detail.editor.appendChild(this.caret);
    });
  };
};

export {
  Caret
}
