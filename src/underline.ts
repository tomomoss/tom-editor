/**
 * フォーカス位置を強調する下線を制御します。
 * @param {Main} root ライブラリのエントリポイントです。
 * @param {boolean} readonlyFlag 読みとり専用状態ならばtrueが入ります。
 */
const Underline = class {
  constructor(root: Main, readonlyFlag: boolean) {
    this.root = root;
    this.readonlyFlag = readonlyFlag;
    this.styleClass = {
      underline: {
        element: "tom-editor__underline",
        modifier: {
          valid: "tom-editor__underline--valid"
        }
      }
    };
    this.underline = this.createUnderline();
    this.defineEventListeners();
  }

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
   * イベントリスナーを定義します。
   */
  defineEventListeners = (): void => {
    this.root.addEventListener("Main-initialize", (event: CustomEventInit<MainInitializeEvent>) => {
      if (typeof event.detail === "undefined") {
        throw new Error("LineNumberArea.prototype.defineEventListeners: Main-initializeイベントの通知内容が不正です。");
      }
      event.detail.editor.appendChild(this.underline);
    });
  };
};

export {
  Underline
}
