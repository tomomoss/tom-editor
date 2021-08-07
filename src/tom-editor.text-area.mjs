"use strict";

/**
 * 文字領域です。
 */
const TextArea = class {

  /**
   * 文字領域を初期化します。
   * @param {HTMLDivElement} editor エディター本体です。
   */
  constructor(editor) {
    this.textArea = this.createTextArea();
    editor.appendChild(this.textArea);

    // 1行目の挿入処理はちょっと特殊なのでここにべた書きします。
    const textLine = this.createTextLine();
    this.textLines.push(textLine);
    this.textArea.appendChild(textLine);
    this.characters.push([]);
    const EOL = this.createEOL();
    this.characters[0].push(EOL);
    textLine.appendChild(EOL);
  }

  /** @type {Array<Array<HTMLDivElement>>} Webページに挿入されている文字です。 */
  characters = [];

  /** @type {number} 現在フォーカス中の列を指すインデックスです。 */
  focusedColumnIndex = null;

  /** @type {number} 現在フォーカス中の行を指すインデックスです。 */
  focusedRowIndex = null;

  /** @type {HTMLDivElement} 文字領域です。 */
  textArea = null;

  /** @type {Array<HTMLDivElement>} Webページに挿入されている行です。 */
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
    this.textLines[this.focusedRowIndex].after(textLine);

    // フォーカス位置を更新します。
    this.focusedRowIndex += 1;
    this.focusedColumnIndex = 0;
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
   * 行の先頭に配置する空間を生成します。
   * @returns {HTMLDivElement} 行頭文字です。
   */
  createLeadingSpace = () => {
    const leadingSpace = document.createElement("span");
    leadingSpace.classList.add("tom-editor__text-area__leading-space");
    return leadingSpace;
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
    const leadingSpace = this.createLeadingSpace();
    textLine.appendChild(leadingSpace);
    return textLine;
  };

  /**
   * 現在フォーカスしている行の最後の文字のインデックスを返します。
   */
  getCharactersLastIndex = () => {
    return this.characters[this.focusedRowIndex].length - 1;
  };

  /**
   * イベントリスナーを実装します。
   * @param {HTMLDivElement} lineNumberArea 行番号領域です。
   * @param {HTMLDivElement} caret キャレットです。
   */
  setEventListeners = (lineNumberArea, caret) => {

    // 文字領域のどこかをクリックされたときは押された場所に応じてフォーカス位置を更新します。
    // 更新後の位置を行番号領域とキャレットに通知します。
    this.textArea.addEventListener("mousedown", (event) => {
      this.updateFocusIndexByMousedownTarget(event);
      lineNumberArea.dispatchEvent(new CustomEvent("mousedownTextArea", {
        detail: {
          index: this.focusedRowIndex
        }
      }));
      const focusedCharacter = this.characters[this.focusedRowIndex][this.focusedColumnIndex].getBoundingClientRect();
      const textArea = this.textArea.getBoundingClientRect();
      caret.dispatchEvent(new CustomEvent("mousedownTextArea", {
        detail: {
          left: focusedCharacter.left - textArea.left,
          top: focusedCharacter.top - textArea.top
        }
      }));
    });
  };

  /**
   * mousedownイベントが発生したHTML要素に応じてフォーカス位置を更新します。
   * @param {Event} event mousedownイベントのEventオブジェクトです。
   */
  updateFocusIndexByMousedownTarget = (event) => {

    // 文字（行末文字含む）がクリックされたされたときは、その文字をそのままフォーカス位置とします。
    if (event.target.classList.contains("tom-editor__text-area__character")) {
      this.focusedRowIndex = this.textLines.findIndex((textLine) => {
        return textLine === event.path[1];
      });
      this.focusedColumnIndex = this.characters[this.focusedRowIndex].findIndex((character) => {
        return character === event.target;
      });
      return;
    }
    
    // 行先頭の空間がクリックされたときは次行の先頭をフォーカス位置とします。
    // 次行がない場合は当該空間が挿入されている行の行末文字をフォーカス位置とします。
    if (event.target.classList.contains("tom-editor__text-area__leading-space")) {
      const mousedownedTextLineIndex = this.textLines.findIndex((textLine) => {
        return textLine === event.path[1];
      });
      if (this.textLines[mousedownedTextLineIndex + 1]) {
        this.focusedRowIndex = mousedownedTextLineIndex + 1;
        this.focusedColumnIndex = 0
      } else {
        this.focusedRowIndex = mousedownedTextLineIndex;
        this.focusedColumnIndex = this.getCharactersLastIndex();
      }
      return;
    }
    
    // 行がクリックされたときは当該行の行末文字をフォーカス位置とします。
    if (event.target.classList.contains("tom-editor__text-area__text-line")) {
      this.focusedRowIndex = this.textLines.findIndex((textLine) => {
        return textLine === event.target;
      });
      this.focusedColumnIndex = this.getCharactersLastIndex();
      return;
    }

    throw new Error(`想定外のHTML要素がクリックされました（${event.target.classList}）。`);
  };

























  /**
   * フォーカス中の文字の座標をキャレットに送信します。
   * @param {HTMLDivElement} caret キャレットです。
   */
  dispatchFocusedCharacterPosition = (caret) => {
    const focusedCharacterRect = this.characters[this.focusedRowIndex][this.focusedColumnIndex].getBoundingClientRect();
    const textAreaRect = this.textArea.getBoundingClientRect();
    caret.dispatchEvent(new CustomEvent("custom-changefocus", {
      detail: {
        left: focusedCharacterRect.left,
        top: focusedCharacterRect.top - textAreaRect.top + parseFloat(getComputedStyle(this.textArea).marginTop)
      }
    }));
  };

  /**
   * 文字領域に入力されている行の情報・状態を行番号領域に送信します。
   * @param {HTMLDivElement} lineNumberArea 行番号領域です。
   */
  dispatchTextLinesStatus = (lineNumberArea) => {
    lineNumberArea.dispatchEvent(new CustomEvent("custom-changetextline", {
      detail: {
        index: this.focusedRowIndex,
        length: this.textLines.length
      }
    }));
  };



  /**
   * Webページに挿入中の行のうち、最後の行のインデックスを返します。
   */
  getTextLinesLastIndex = () => {
    return this.textLines.length - 1;
  };

  /**
   * 引数に指定された文字を文章に挿入します。
   * @param {string} innerCharacter 挿入対象となる文字です。
   */
  inputCharacter = (innerCharacter) => {
    const character = this.createCharacter(innerCharacter);
    this.characters[this.focusedRowIndex].splice(this.focusedColumnIndex, 0, character);
    this.focusedColumnIndex += 1;
    this.characters[this.focusedRowIndex][this.focusedColumnIndex].before(character);
  };

  /**
   * 押されたキーに応じた処理を実行します。
   * @param {string} key 押されたキーです。
   * @returns {boolean} 有効なキーだった場合はtrueを返します。
   */
  reflectKey = (key) => {
    if (key.length === 1) {
      this.inputCharacter(key);
      return true;
    }
    if (key === "ArrowDown") {
      if (this.focusedRowIndex === this.getTextLinesLastIndex()) {
        this.focusedColumnIndex = this.getCharactersLastIndex();
        return true;
      }
      this.focusedRowIndex += 1;
      if (this.characters[this.focusedRowIndex][this.focusedColumnIndex]) {
        return true;
      }
      this.focusedColumnIndex = this.getCharactersLastIndex();
      return true;
    }
    if (key === "ArrowLeft") {
      if (this.focusedColumnIndex === 0) {
        if (this.focusedRowIndex === 0) {
          return true;
        }
        this.focusedRowIndex -= 1;
        this.focusedColumnIndex = this.getCharactersLastIndex();
        return true;
      }
      this.focusedColumnIndex -= 1;
      return true;
    }
    if (key === "ArrowRight") {
      if (this.focusedColumnIndex === this.getCharactersLastIndex()) {
        if (this.focusedRowIndex === this.getTextLinesLastIndex()) {
          return true
        }
        this.focusedRowIndex += 1;
        this.focusedColumnIndex = 0;
        return true;
      }
      this.focusedColumnIndex += 1;
      return true;
    }
    if (key === "ArrowUp") {
      if (this.focusedRowIndex === 0) {
        this.focusedColumnIndex = 0;
        return true;
      }
      this.focusedRowIndex -= 1;
      if (this.characters[this.focusedRowIndex][this.focusedColumnIndex]) {
        return true;
      }
      this.focusedColumnIndex = this.getCharactersLastIndex();
      return true;
    }
    if (key === "Backspace") {
      if (this.focusedColumnIndex === 0) {
        if (this.focusedRowIndex === 0) {
          return true;
        }
        this.focusedRowIndex -= 1;
        this.focusedColumnIndex = this.getCharactersLastIndex();
        this.removeTextLine();
        return true;
      }
      this.focusedColumnIndex -= 1;
      this.characters[this.focusedRowIndex].splice(this.focusedColumnIndex, 1)[0].remove();
      return true;
    }
    if (key === "Delete") {
      if (this.focusedColumnIndex === this.getCharactersLastIndex()) {
        if (this.focusedRowIndex === this.getTextLinesLastIndex()) {
          return true;
        }
        this.removeTextLine();
        return true;
      }
      this.characters[this.focusedRowIndex].splice(this.focusedColumnIndex, 1)[0].remove();
      return true;
    }
    if (key === "End") {
      this.focusedColumnIndex = this.getCharactersLastIndex();
      return true;
    }
    if (key === "Enter") {
      const deleteCount = this.getCharactersLastIndex() - this.focusedColumnIndex;
      this.appendTextLine(this.characters[this.focusedRowIndex].splice(this.focusedColumnIndex, deleteCount));
      return true;
    }
    if (key === "Home") {
      this.focusedColumnIndex = 0;
      return true;
    }
    if (key === "Tab") {
      const tab = "    ";
      for (const character of tab) {
        this.inputCharacter(character);
      }
      return true;
    }
    return false;
  };

  /**
   * 行の削除と、行の削除に伴う文字移動を行います。
   */
  removeTextLine = () => {

    // 文字を移動します。
    const movingCharacters = this.characters[this.focusedRowIndex + 1].splice(0);
    for (const character of movingCharacters.reverse()) {
      this.characters[this.focusedRowIndex].splice(this.focusedColumnIndex + 1, 0, character);
      this.characters[this.focusedRowIndex][this.focusedColumnIndex].after(character);
    }

    // 文字が全て抽出されて不要になった行を削除します。
    this.textLines.splice(this.focusedRowIndex + 1, 1)[0].remove();
    this.characters.splice(this.focusedRowIndex + 1, 1);

    // このままだと1つの行に2つのEOLが混在するので元々入っていたほうのEOLを削除します。
    this.characters[this.focusedRowIndex].splice(this.focusedColumnIndex, 1)[0].remove();
  };
};

export {
  TextArea
}
