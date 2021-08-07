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

  /** @type {Array<Array<HTMLDivElement>>} 選択範囲中の文字です。 */
  selectionRange = [];

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
   * 選択範囲に含まれている文字を表すHTML要素群を文字列に変換します。
   * @param {boolean} cutFlag 変換時に範囲選択した範囲を削除するかどうかのフラグです。
   * @returns {string} 文字列化した範囲選択された値です。
   */
  convertSelectedRangeIntoText = (cutFlag) => {
    let convertedText;
    if (this.selectionRange.length) {
      for (const textLine of this.selectionRange) {
        for (const character of textLine) {
          convertedText += character.innerHTML;
        }
      }

      /*
      convertedText = this.selectionRange.reduce((accumulator, currentValue) => {
        return accumulator + currentValue.reduce((accumulator, currentValue) => {
          return accumulator + currentValue.innerHTML;
        }) + "\n";
      });
      */
    } else {
      convertedText = "";
    }
    if (cutFlag) {
      this.removeCharactersInSelectionRange();
    }
    return convertedText;
  };

  /**
   * 文字を生成します。
   * @param {number|string} innerText 文字となるHTML要素に入れる値です。
   * @returns {HTMLSpanElement} 文字です。
   */
  createCharacter = (innerHTML) => {
    const character = document.createElement("span");
    character.classList.add("tom-editor__text-area__character");
    character.innerHTML = innerHTML;
    return character
  };

  /**
   * 行末文字を生成します。
   * @returns {HTMLSpanElement} 行末文字です。
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
   * 他の領域に文字領域の状態を通知します。
   * @param {string} eventName イベント名です。
   * @param {HTMLDivElement} lineNumberArea 行番号領域です。
   * @param {HTMLDivElement} caret キャレットです。
   */
  dispatchTextAreaStatusToOtherArea = (eventName, lineNumberArea, caret) => {
    if (["mousedownTextArea", "keydownCaret2"].includes(eventName)) {
      lineNumberArea.dispatchEvent(new CustomEvent(eventName, {
        detail: {
          index: this.focusedRowIndex,
          length: this.textLines.length
        }
      }));
      const focusedCharacter = this.getFocusedCharacter().getBoundingClientRect();
      const textArea = this.textArea.getBoundingClientRect();
      caret.dispatchEvent(new CustomEvent(eventName, {
        detail: {
          left: focusedCharacter.left - textArea.left,
          top: focusedCharacter.top - textArea.top
        }
      }));
    }
  };

  /**
   * 現在フォーカスしている行の最後の文字のインデックスを返します。
   */
  getColumnsLastIndex = () => {
    return this.characters[this.focusedRowIndex].length - 1;
  };

  /**
   * 現在フォーカスしている文字を返します。
   * @returns {null|HTMLSpanElement} フォーカスしている文字です。
   */
  getFocusedCharacter = () => {
    if (this.focusedRowIndex === null) {
      return null;
    }
    return this.characters[this.focusedRowIndex][this.focusedColumnIndex];
  };

  /**
   * Webページに挿入中の行のうち、最後の行のインデックスを返します。
   */
  getRowsLastIndex = () => {
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
    this.getFocusedCharacter().before(character);
  };

  /**
   * 矢印キーによるフォーカス位置と選択範囲の更新処理です。
   * @param {string} arrowKey 押された方向です。
   * @param {boolean} shiftKey Shiftキーが押されているときはtrueになります。
   */
  moveFocusPointByArrowKey = (arrowKey, shiftKey) => {
    if (arrowKey === "ArrowDown") {
      const goalRowIndex = this.focusedRowIndex + 1;
      const goalColumnIndex = this.focusedColumnIndex;
      while (
        !(this.focusedRowIndex === goalRowIndex && this.focusedColumnIndex === goalColumnIndex) &&
        !(this.focusedRowIndex === this.getRowsLastIndex() && this.focusedColumnIndex === this.getColumnsLastIndex())
      ) {
        this.moveFocusPointByArrowKey("ArrowRight", shiftKey);
      }
      return true;
    }
    if (arrowKey === "ArrowLeft") {
      if (this.focusedColumnIndex === 0) {
        if (this.focusedRowIndex === 0) {

          // 文頭にいるときは何もできないので処理から抜けます。
          return;
        }

        // 行頭にいるときは前の行の行末文字に移動します。
        this.focusedRowIndex -= 1;
        this.focusedColumnIndex = this.getColumnsLastIndex();
        if (!shiftKey) {
          return;
        }

        // 新しく範囲選択を始めるときの処理です。
        if (!this.selectionRange.length) {
          this.getFocusedCharacter().classList.add("tom-editor__text-area__character--select");
          this.selectionRange.push([this.getFocusedCharacter()]);
          return;
        }

        // 選択範囲が拡大されるときの処理です。
        if (!this.getFocusedCharacter().classList.contains("tom-editor__text-area__character--select")) {
          this.getFocusedCharacter().classList.add("tom-editor__text-area__character--select");
          this.selectionRange.unshift([this.getFocusedCharacter()]);
          return;
        }

        // 選択範囲が縮小されるときの処理です。
        this.getFocusedCharacter().classList.remove("tom-editor__text-area__character--select");
        this.selectionRange.pop();
        this.selectionRange[this.selectionRange.length - 1].pop();
        if (!this.selectionRange[0].length && this.selectionRange.length === 1) {
          this.selectionRange = [];
          return;
        }
        return;

      }

      // 文中にいるときは1つ前の文字に移動します。
      this.focusedColumnIndex -= 1;
      if (!shiftKey) {
        return;
      }

      // 新しく範囲選択を始めるときの処理です。
      if (!this.selectionRange.length) {
        this.getFocusedCharacter().classList.add("tom-editor__text-area__character--select");
        this.selectionRange.push([this.getFocusedCharacter()]);
        return;
      }

      // 選択範囲が拡大されるときの処理です。
      if (!this.getFocusedCharacter().classList.contains("tom-editor__text-area__character--select")) {
        this.getFocusedCharacter().classList.add("tom-editor__text-area__character--select");
        this.selectionRange[0].unshift(this.getFocusedCharacter());
        return;
      }

      // 選択範囲が縮小されるときの処理です。
      this.getFocusedCharacter().classList.remove("tom-editor__text-area__character--select");
      this.selectionRange[this.selectionRange.length - 1].pop();
      if (!this.selectionRange[0].length && this.selectionRange.length === 1) {
        this.selectionRange = [];
        return;
      }
      return;
    }
    if (arrowKey === "ArrowRight") {
      if (this.focusedColumnIndex === this.getColumnsLastIndex()) {
        if (this.focusedRowIndex === this.getRowsLastIndex()) {

          // 文末にいるときは何もできないので処理から抜けます。
          return;
        }

        // 行末にいるときは次の行の先頭に移動します。
        this.focusedRowIndex += 1;
        this.focusedColumnIndex = 0;
        if (!shiftKey) {
          return;
        }

        const previousFocusedCharacter = this.characters[this.focusedRowIndex - 1][this.characters[this.focusedRowIndex - 1].length - 1];

        // 新しく範囲選択を始めるときの処理です。
        if (!this.selectionRange.length) {
          previousFocusedCharacter.classList.add("tom-editor__text-area__character--select");
          this.selectionRange.push([previousFocusedCharacter]);
          return;
        }

        // 選択範囲が拡大されるときの処理です。
        if (!previousFocusedCharacter.classList.contains("tom-editor__text-area__character--select")) {
          previousFocusedCharacter.classList.add("tom-editor__text-area__character--select");
          this.selectionRange[this.selectionRange.length - 1].push(previousFocusedCharacter);
          this.selectionRange.push([]);
          return;
        }

        // 選択範囲が縮小されるときの処理です。
        previousFocusedCharacter.classList.remove("tom-editor__text-area__character--select");
        this.selectionRange.shift();
        if (!this.selectionRange[0].length) {
          this.selectionRange = [];
          return;
        }
        return;

      }

      // 文中にいるときは1つ次の文字に移動します。
      this.focusedColumnIndex += 1;
      if (!shiftKey) {
        return;
      }

      const previousFocusedCharacter = this.characters[this.focusedRowIndex][this.focusedColumnIndex - 1];

      // 新しく範囲選択を始めるときの処理です。
      if (!this.selectionRange.length) {
        previousFocusedCharacter.classList.add("tom-editor__text-area__character--select");
        this.selectionRange.push([previousFocusedCharacter]);
        return;
      }

      // 選択範囲が拡大されるときの処理です。
      if (!previousFocusedCharacter.classList.contains("tom-editor__text-area__character--select")) {
        previousFocusedCharacter.classList.add("tom-editor__text-area__character--select");
        this.selectionRange[this.selectionRange.length - 1].push(previousFocusedCharacter);
        return;
      }

      // 選択範囲が縮小されるときの処理です。
      previousFocusedCharacter.classList.remove("tom-editor__text-area__character--select");
      this.selectionRange[0].shift();
      if (!this.selectionRange[0].length) {
        this.selectionRange = [];
        return;
      }
      return;
    }
    if (arrowKey === "ArrowUp") {
      const goalRowIndex = this.focusedRowIndex - 1;
      const goalColumnIndex = this.focusedColumnIndex;
      while (
        !(this.focusedRowIndex === goalRowIndex && this.focusedColumnIndex === goalColumnIndex) &&
        !(this.focusedRowIndex === goalRowIndex && this.focusedColumnIndex < goalColumnIndex) &&
        !(this.focusedRowIndex === 0 && this.focusedColumnIndex === 0)
      ) {
        this.moveFocusPointByArrowKey("ArrowLeft", shiftKey);
      }
      return true;
    }
  };

  /**
   * 押されたキーに応じた処理を実行します。
   * @param {string} key 入力された値です。
   * @param {boolean} shiftKey Shiftキーが押されているときはtrueになります。
   * @returns {boolean} 有効なキーだった場合はtrueを返します。
   */
  reflectKey = (key, shiftKey) => {

    // 文字入力処理です。
    if (key.length === 1) {
      this.inputCharacter(key);
      return true;
    }

    // 矢印キーによるフォーカス位置の変更と範囲選択の更新処理です。
    if (key.includes("Arrow")) {
      if (this.selectionRange.length && !shiftKey) {

        // 範囲選択がされている状態で、Shiftキーを押さずに矢印キーが押された場合は選択範囲の解除だけを行います。
        this.unselctRange();
        return true;
      }
      this.moveFocusPointByArrowKey(key, shiftKey);
      return true;
    }

    // BackspaceキーとDeleteキーによる、文字あるいは選択範囲の削除処理です。
    if (key === "Backspace") {
      if (this.focusedColumnIndex === 0) {
        if (this.focusedRowIndex === 0) {
          return true;
        }
        this.focusedRowIndex -= 1;
        this.focusedColumnIndex = this.getColumnsLastIndex();
        this.removeTextLine();
        return true;
      }
      this.focusedColumnIndex -= 1;
      this.characters[this.focusedRowIndex].splice(this.focusedColumnIndex, 1)[0].remove();
      return true;
    }
    if (key === "Delete") {
      if (this.focusedColumnIndex === this.getColumnsLastIndex()) {
        if (this.focusedRowIndex === this.getRowsLastIndex()) {
          return true;
        }
        this.removeTextLine();
        return true;
      }
      this.characters[this.focusedRowIndex].splice(this.focusedColumnIndex, 1)[0].remove();
      return true;
    }

    // その他キーの処理です。
    if (key === "End") {
      this.focusedColumnIndex = this.getColumnsLastIndex();
      return true;
    }
    if (key === "Enter") {
      const deleteCount = this.getColumnsLastIndex() - this.focusedColumnIndex;
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
      this.getFocusedCharacter().after(character);
    }

    // 文字が全て抽出されて不要になった行を削除します。
    this.textLines.splice(this.focusedRowIndex + 1, 1)[0].remove();
    this.characters.splice(this.focusedRowIndex + 1, 1);

    // このままだと1つの行に2つのEOLが混在するので元々入っていたほうのEOLを削除します。
    this.characters[this.focusedRowIndex].splice(this.focusedColumnIndex, 1)[0].remove();
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

      // これがないとキャレット（textareaタグ）にフォーカス状態のときに、
      // 当イベントリスナーが走ると勝手にblurしてしまいます。
      event.preventDefault();

      this.unselctRange();
      this.updateFocusIndexByMousedownTarget(event);
      this.dispatchTextAreaStatusToOtherArea("mousedownTextArea", lineNumberArea, caret);
    });

    // キャレットのフォーカスが外れたのでフォーカス情報を消去します。
    this.textArea.addEventListener("blurCaret", () => {
      this.focusedRowIndex = null;
      this.focusedColumnIndex = null;
    });

    // キャレットにキー入力があったので押されたキーに応じた処理を実行します。
    // 有効なキー入力だった場合はフォーカス位置や行数が変わっている可能性があります。
    // そこで文字領域に対してmousedownイベントを発信することで行番号領域とキャレットに変更後の状態を通知します。
    this.textArea.addEventListener("keydownCaret1", (event) => {
      if (!this.reflectKey(event.detail.key, event.detail.shiftKey)) {
        return;
      }
      this.dispatchTextAreaStatusToOtherArea("keydownCaret2", lineNumberArea, caret);
    });
  };

  /**
   * 選択範囲を解除します。
   */
  unselctRange = () => {
    for (const charactersInSelectionRange of this.selectionRange) {
      for (const characterInSelectionRange of charactersInSelectionRange) {
        characterInSelectionRange.classList.remove("tom-editor__text-area__character--select");
      }
    }
    this.selectionRange = [];
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
        this.focusedColumnIndex = this.getColumnsLastIndex();
      }
      return;
    }

    // 行がクリックされたときは当該行の行末文字をフォーカス位置とします。
    if (event.target.classList.contains("tom-editor__text-area__text-line")) {
      this.focusedRowIndex = this.textLines.findIndex((textLine) => {
        return textLine === event.target;
      });
      this.focusedColumnIndex = this.getColumnsLastIndex();
      return;
    }
  };
};

export {
  TextArea
}
