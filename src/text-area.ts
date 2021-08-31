/**
 * 文字領域を制御します。
 * @param {Main} root ライブラリのエントリポイントです。
 * @param {boolean} readonlyFlag 読みとり専用状態ならばtrueが入ります。
 */
const TextArea = class {
  constructor(root: Main, readonlyFlag: boolean) {
    this.root = root;
    this.readonlyFlag = readonlyFlag;
    this.styleClass = {
      character: {
        element: "tom-editor__text-area__character",
        modifier: {
          eol: "tom-editor__text-area__character--eol"
        }
      },
      textArea: {
        element: "tom-editor__text-area"
      },
      textLine: {
        element: "tom-editor__text-area__text-line"
      },
      textLinesWrapper: {
        element: "tom-editor__text-area__text-lines-wrapper"
      }
    };
    this.textArea = this.createTextArea();
    this.textLinesWrapper = this.createTextLinesWrapper();
    this.textArea.appendChild(this.textLinesWrapper);
    const firstTextLine = this.createTextLine();
    this.textLinesWrapper.appendChild(firstTextLine);
    const eolOfFirstTextLine = this.createCharacter("eol");
    firstTextLine.appendChild(eolOfFirstTextLine);
    this.contents = [{
      characterList: [eolOfFirstTextLine],
      textLine: firstTextLine
    }];
    this.defineEventListeners();
  }

  /** @type {TextAreaContents} Webページに挿入中の行と文字をまとめたオブジェクトです。 */
  contents: TextAreaContents[];

  /** @type {boolean} 読みとり専用状態ならばtrueが入ります。 */
  readonlyFlag: boolean;

  /** @type {Main} ライブラリのエントリポイントです。 */
  root: Main;

  /** @type {TextAreaStyleClass} 当クラスで使用するCSSクラスをまとめたオブジェクトです。 */
  styleClass: TextAreaStyleClass;

  /** @type {HTMLDivElement} 文字領域です。 */
  textArea: HTMLDivElement;

  /** @type {HTMLDivElement} 行のラッパー要素です。 */
  textLinesWrapper: HTMLDivElement;

  /**
   * 文字を生成します。
   * @param {string | "eof"} value 生成する文字を指定する値です。
   * @returns {HTMLSpanElement} 文字です。
   */
  createCharacter = (value: string): HTMLSpanElement => {
    const character = document.createElement("span");
    character.classList.add(this.styleClass.character.element);
    if (value === "eol") {
      character.classList.add(this.styleClass.character.modifier.eol);
      character.textContent = " ";
      return character;
    }
    if (value.length === 1) {
      character.textContent = value;
      return character
    }
    throw new Error(`TextArea.prototype.createCharacter: 不正な引数です（${value}）。`);
  };

  /**
   * 文字領域を作成します。
   * @returns {HTMLDivElement} 文字領域です。
   */
  createTextArea = (): HTMLDivElement => {
    const textArea = document.createElement("div");
    textArea.classList.add(this.styleClass.textArea.element);
    if (this.readonlyFlag) {
      textArea.style.cursor = "default";
    }
    return textArea;
  };

  /**
   * 行を生成します。
   * @returns {HTMLDivElement} 行です。
   */
  createTextLine = (): HTMLDivElement => {
    const textLine = document.createElement("div");
    textLine.classList.add(this.styleClass.textLine.element);
    return textLine;
  };

  /**
   * 行のラッパー要素を生成します。
   * @returns {HTMLDivElement} 行のラッパー要素です。
   */
  createTextLinesWrapper = (): HTMLDivElement => {
    const textLinesWrapper = document.createElement("div");
    textLinesWrapper.classList.add(this.styleClass.textLinesWrapper.element);
    return textLinesWrapper;
  };

  /**
   * イベントリスナーを定義します。
   */
  defineEventListeners = (): void => {
    this.root.addEventListener("Main-initialize", (event: CustomEventInit<MainInitializeEvent>) => {
      if (typeof event.detail === "undefined") {
        throw new Error("LineNumberArea.prototype.defineEventListeners: Main-initializeイベントの通知内容が不正です。");
      }
      event.detail.editor.appendChild(this.textArea);
    });
  };
};

export {
  TextArea
}
