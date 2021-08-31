/**
 * 行番号領域を制御します。
 * @param {Main} root ライブラリのエントリポイントです。
 * @param {boolean} readonlyFlag 読みとり専用状態ならばtrueが入ります。
 */
const LineNumberArea = class {
  constructor(root: Main, readonlyFlag: boolean) {
    this.root = root;
    this.readonlyFlag = readonlyFlag;
    this.styleClass = {
      lineNumber: {
        element: "tom-editor__line-number-area__line-number",
        modifier: {
          focus: "tom-editor__line-number-area__line-number--focus",
          readOnly: "tom-editor__line-number-area__line-number--read-only"
        }
      },
      lineNumberArea: {
        element: "tom-editor__line-number-area",
        modifier: {
          readOnly: "tom-editor__line-number-area--read-only"
        }
      }
    };
    this.lineNumberArea = this.createLineNumberArea();
    this.lineNumberList = [];
    this.appendLineNumber();
    this.defineEventListeners();
  }

  /** @type {HTMLDivElement} 行番号領域です */
  lineNumberArea: HTMLDivElement;

  /** @type {HTMLDivElement[]} Webページに挿入中の行番号をまとめた配列です。 */
  lineNumberList: HTMLDivElement[];

  /** @type {boolean} 読みとり専用状態ならばtrueが入ります。 */
  readonlyFlag: boolean;

  /** @type {Main} ライブラリのエントリポイントです。 */
  root: Main;

  /** @type {LineNumberAreaStyleClass} 当クラスで使用するCSSクラスをまとめたオブジェクトです。 */
  styleClass: LineNumberAreaStyleClass;

  /**
   * 行番号を1つ追加します。
   */
  appendLineNumber = (): void => {
    const lineNumber = this.createLineNumber();
    this.lineNumberList.push(lineNumber);
    this.lineNumberArea.appendChild(lineNumber);
  };

  /**
   * 行番号を生成します。
   * @returns {HTMLDivElement} 行番号です。
   */
  createLineNumber = (): HTMLDivElement => {
    const lineNumber = document.createElement("div");
    lineNumber.classList.add(this.styleClass.lineNumber.element);
    if (this.lineNumberArea.classList.contains(this.styleClass.lineNumberArea.modifier.readOnly)) {
      lineNumber.classList.add(this.styleClass.lineNumber.modifier.readOnly);
    }
    lineNumber.textContent = `${this.lineNumberList.length + 1}`;
    return lineNumber;
  };

  /**
   * 行番号領域を生成します。
   * @returns {HTMLDivElement} 行番号領域です。
   */
  createLineNumberArea = (): HTMLDivElement => {
    const lineNumberArea = document.createElement("div");
    lineNumberArea.classList.add(this.styleClass.lineNumberArea.element);
    if (this.readonlyFlag) {
      lineNumberArea.classList.add(this.styleClass.lineNumberArea.modifier.readOnly);
    }
    return lineNumberArea;
  };

  /**
   * イベントリスナーを定義します。
   */
  defineEventListeners = (): void => {
    this.root.addEventListener("Main-initialize", (event: CustomEventInit<MainInitializeEvent>) => {
      if (typeof event.detail === "undefined") {
        throw new Error("LineNumberArea.prototype.defineEventListeners: Main-initializeイベントの通知内容が不正です。");
      }
      event.detail.editor.appendChild(this.lineNumberArea);
    });
  };
};

export {
  LineNumberArea
}
