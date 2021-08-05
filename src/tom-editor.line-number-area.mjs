"use strict";

/**
 * 行番号領域です。
 */
const LineNumberArea = class {

  /**
   * 行番号領域を初期化します。
   * @param {HTMLDivElement} tomEditor エディター本体です。
   */
  constructor(tomEditor) {
    this.lineNumberArea = this.createLineNumberArea(tomEditor);
    tomEditor.appendChild(this.lineNumberArea);
    this.negativeSpace = this.createNegativeSpace();
    this.lineNumberArea.appendChild(this.negativeSpace);
    this.appendLineNumber();
  }

  /** @type {HTMLDivElement} 行番号領域です */
  lineNumberArea;

  /** @type {Array<HTMLDivElement>} Webページに表示中の行です。 */
  lineNumbers = [];

  /** @type {HTMLDivElement} 行番号領域下部の余白です。 */
  negativeSpace;

  /**
   * 行番号を1つ追加します。
   */
  appendLineNumber = () => {
    const lineNumber = this.createLineNumber();
    this.lineNumbers.push(lineNumber);
    this.negativeSpace.before(lineNumber);
  };

  /**
   * 行番号を生成します。
   * @returns {HTMLDivElement} 行番号です。
   */
  createLineNumber = () => {
    const lineNumber = document.createElement("div");
    lineNumber.classList.add("tom-editor__line-number-area__line-number");
    lineNumber.innerHTML = this.lineNumbers.length + 1;
    return lineNumber;
  };

  /**
   * 行番号領域を生成します。
   * @param {HTMLDivElement} tomEditor エディター本体です。
   * @returns {HTMLDivElement} 行番号領域です。
   */
  createLineNumberArea = (tomEditor) => {

    // 半角英数字の横幅を求めます。
    const temporaryElement = document.createElement("span");
    temporaryElement.innerHTML = "0";
    tomEditor.appendChild(temporaryElement);
    const alphanumericWidth = temporaryElement.getBoundingClientRect().width;
    temporaryElement.remove();

    // 行番号領域に表示する桁数です。
    // とりえあず4桁指定しておきます。
    const maximumNumberOfDigits = 4;

    // 行番号領域を生成します。
    const lineNumberArea = document.createElement("div");
    lineNumberArea.classList.add("tom-editor__line-number-area");
    lineNumberArea.style.flexBasis = `${alphanumericWidth * maximumNumberOfDigits}px`;

    return lineNumberArea;
  };

  /**
   * 行番号領域下部の余白を作成します。
   * @returns {HTMLDivElement} 行番号領域下部の余白です。
   */
  createNegativeSpace = () => {
    const negativeSpace = document.createElement("div");
    negativeSpace.classList.add("tom-editor__line-number-area__negative-space");
    return negativeSpace;
  };
};

export {
  LineNumberArea
}
