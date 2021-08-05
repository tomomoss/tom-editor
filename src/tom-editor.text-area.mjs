"use strict";

/**
 * 文字領域です。
 */
const TextArea = class {

  /**
   * 文字領域を初期化します。
   * @param {HTMLDivElement} tomEditor エディター本体です。
   */
  constructor(tomEditor) {
    this.textArea = this.createTextArea();
    tomEditor.appendChild(this.textArea);
    this.negativeSpace = this.createNegativeSpace();
    this.textArea.appendChild(this.negativeSpace);
    this.focusedRowIndex = -1;
    this.appendTextLine([]);
    this.focusedRowIndex = undefined;
    this.focusedColumnIndex = undefined;
  }

  /** @type {Array<Array<HTMLSpanElement>>} Webページに表示中の文字です。 */
  characters = [];

  /** @type {number} 現在フォーカス中の列を指すインデックスです。 */
  focusedColumnIndex;

  /** @type {number} 現在フォーカス中の行を指すインデックスです。 */
  focusedRowIndex;

  /** @type {HTMLDivElement} 文字領域下部の余白です。 */
  negativeSpace;

  /** @type {HTMLDivElement} 文字領域です。 */
  textArea;

  /** @type {Array<HTMLDivElement>} Webページに表示中の行です。 */
  textLines = [];

  /**
   * 文字領域に新規行を挿入します。
   * @param {Array<HTMLSpanElement>} innerCharacters 行に最初から含める文字です。
   */
  appendTextLine = (innerCharacters) => {

    // 行を生成します。
    const textLine = this.createTextLine();
    this.textLines.splice(this.focusedRowIndex + 1, 0, textLine);
    this.characters.splice(this.focusedRowIndex + 1, 0, []);

    // 行に文字を入れていきます。
    const EOL = this.createEOL();
    innerCharacters.push(EOL);
    for (const character of innerCharacters) {
      textLine.appendChild(character);
      this.characters[this.focusedRowIndex + 1].push(character);
    }
    
    // Webページに行を挿入します。
    if (this.focusedRowIndex === -1) {
      this.negativeSpace.before(textLine);
    } else {
      this.textLines[this.focusedRowIndex].after(textLine);
    }
    
    // フォーカス位置を更新します。
    this.focusedRowIndex += 1;
    this.focusedColumnIndex = 0;
  };

  /**
   * 文字を生成します。
   * @param {string} innerCharacter 文字を表すHTML要素に入れるstring型データです。
   * @returns {HTMLDivElement} 文字です。
   */
  createCharacter = (innerCharacter) => {
    const character = document.createElement("span");
    character.classList.add("tom-editor__text-area__character");
    character.innerHTML = innerCharacter;
    return character;
  };

  /**
   * 行末文字を生成します。
   * @returns {HTMLDivElement} 行末文字です。
   */
  createEOL = () => {
    const EOL = document.createElement("span");
    EOL.classList.add("tom-editor__text-area__character", "tom-editor__text-area__character--eol");
    EOL.innerHTML = " ";
    return EOL;
  };

  /**
   * 文字領域下部の余白を生成します。
   * @returns {HTMLDivElement} 文字領域下部の余白です。
   */
  createNegativeSpace = () => {
    const negativeSpace = document.createElement("div");
    negativeSpace.classList.add("tom-editor__text-area__negative-space");
    return negativeSpace;
  };

  /**
   * 文字領域を作成します。
   * @returns {HTMLDivElement} 文字領域です。
   */
  createTextArea = () => {
    const textArea = document.createElement("div");
    textArea.classList.add("tom-editor__text-area");
    return textArea;
  };

  /**
   * 行を生成します。
   * @returns {HTMLDivElement} 行です。
   */
  createTextLine = () => {
    const textLine = document.createElement("div");
    textLine.classList.add("tom-editor__text-area__text-line");
    return textLine;
  };
};

export {
  TextArea
}
