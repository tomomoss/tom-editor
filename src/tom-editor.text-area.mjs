"use strict";

/**
 * 文字領域です。
 * @param {HTMLDivElement} editor エディター本体です。
 * @param {boolean} readonlyFlag 読みとり専用状態にするならばtrueが入っています。
 */
const TextArea = class {
  constructor(editor, readonlyFlag) {
    Object.seal(this);
    this.editor = editor;
    this.textArea = this.createTextArea(readonlyFlag);
    this.editor.appendChild(this.textArea);

    // 1行目の挿入処理はちょっと特殊なのでここにべた書きします。
    const textLine = this.createTextLine();
    this.textLines.push(textLine);
    this.textArea.appendChild(textLine);
    this.characters.push([]);
    const EOL = this.createEOL();
    this.characters[0].push(EOL);
    textLine.appendChild(EOL);

    this.lastDispatchedEventValue = {
      index: this.focusedRowIndex,
      length: this.textLines.length,
      scrollLeft: this.textArea.scrollLeft,
      scrollTop: this.textArea.scrollTop,
      selecingRange: Boolean(this.selectionRange.length),
      viewportHeightRatio: this.textArea.clientHeight / this.textArea.scrollHeight,
      viewportWidthRatio: this.textArea.clientWidth / this.textArea.scrollWidth
    };
    this.saveHistory();
    this.setEventListeners(readonlyFlag);
  }

  /** @type {object} 当クラス内で使用するCSSクラスです。 */
  CSSClass = {
    character: {
      element: "tom-editor__text-area__character",
      modifier: {
        EOL: "tom-editor__text-area__character--eol"
      }
    },
    textArea: {
      element: "tom-editor__text-area"
    },
    textLine: {
      element: "tom-editor__text-area__text-line"
    }
  };

  /** @type {Array<Array<HTMLDivElement>>} Webページに挿入されている文字です。 */
  characters = [];

  /** @type {HTMLDivElement} エディター本体です。 */
  editor;

  /** @type {null|number} 現在フォーカス中の列を指すインデックスです。 */
  focusedColumnIndex = null;

  /** @type {null|number} 現在フォーカス中の行を指すインデックスです。 */
  focusedRowIndex = null;

  /** @type {object} 文字領域の変更状態をまとめたオブジェクトです。 */
  history;

  /** @type {object} EventTarget.dispatchEventメソッドの送信対象となる値の、最後に送信されたときの値です。 */
  lastDispatchedEventValue;

  /** @type {Array<Array<HTMLDivElement>>} 選択範囲中の文字です。 */
  selectionRange = [];

  /** @type {HTMLDivElement} 文字領域です。 */
  textArea;

  /** @type {Array<HTMLDivElement>} Webページに挿入されている行です。 */
  textLines = [];

  /**
   * 引数に指定された文字を文章に挿入します。
   * @param {string} innerCharacter 挿入対象となる文字です。
   */
  appendCharacter = (innerCharacter) => {
    const character = this.createCharacter(innerCharacter);
    this.characters[this.focusedRowIndex].splice(this.focusedColumnIndex, 0, character);
    this.focusedColumnIndex += 1;
    this.getFocusedCharacter().before(character);
  };

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
    let convertedText = "";
    if (this.selectionRange.length) {

      // 選択範囲が複数行にまたがるとき、最後の行以外の末尾文字が選択範囲に含まれていますので改行文字に置きかえます。
      for (const textLine of this.selectionRange) {
        for (const character of textLine) {
          if (character.classList.contains("tom-editor__text-area__character--eol")) {
            convertedText += "\n";
            break;
          }
          convertedText += character.textContent;
        }
      }
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
   * @param {number|string} characterNode 文字となるHTML要素に入れる値です。
   * @returns {HTMLSpanElement} 文字です。
   */
  createCharacter = (characterNode) => {
    const character = document.createElement("span");
    character.classList.add(this.CSSClass.character.element);
    character.textContent = characterNode;
    return character
  };

  /**
   * 行末文字を生成します。
   * @returns {HTMLSpanElement} 行末文字です。
   */
  createEOL = () => {
    const EOL = document.createElement("span");
    EOL.classList.add(this.CSSClass.character.element, this.CSSClass.character.modifier.EOL);
    EOL.textContent = " ";
    return EOL;
  };

  /**
   * 文字領域を作成します。
   * @param {boolean} readonlyFlag 読みとり専用状態にするならばtrueが入っています。
   * @returns {HTMLDivElement} 文字領域です。
   */
  createTextArea = (readonlyFlag) => {
    const textArea = document.createElement("div");
    textArea.classList.add(this.CSSClass.textArea.element);
    if (readonlyFlag) {
      textArea.style.cursor = "default";
    }
    return textArea;
  };

  /**
   * 行を生成します。
   * @returns {HTMLDivElement} 行です。
   */
  createTextLine = () => {
    const textLine = document.createElement("div");
    textLine.classList.add(this.CSSClass.textLine.element);
    return textLine;
  };

  /**
   * 現在の入力内容と現在表示中の編集履歴の入力内容の間に差異があるかを確認します。
   * MutationObserverオブジェクトが使えるかと思ったのですが当該オブジェクトは少しでも変更があるたびに走ってしまうので、
   * ペースト処理や日本語入力処理などとの相性が悪いと判断して独自の変更検知処理を用意しました。
   * @returns {boolean} 差異がある場合はtrueを返します。
   */
  differenceBetweenCurrentAndHistory = () => {

    // 行数が異なる場合は差異があると見なします。
    if (this.characters.length !== this.history.data[this.history.index].characters.length) {
      return true;
    }

    for (let i = 0; i < this.characters.length; i += 1) {

      // 1行あたりの文字数が異なる場合も差異があると見なします。
      if (this.characters[i].length !== this.history.data[this.history.index].characters[i].length) {
        return true;
      }

      // 行数に差異がなく、1行あたりの文字数も同じなので1文字ずつ突合させていきます。
      for (let j = 0; j < this.characters[i].length; j += 1) {
        if (this.characters[i][j] !== this.history.data[this.history.index].characters[i][j]) {
          return true;
        }
      }
    }

    return false;
  };

  /**
   * カスタムイベントを発信します。
   */
  dispatchEvents = () => {

    // フォーカス座標の通知処理は変更の有無を問わず通知します。
    // そのため最後に送信されたときの値を保存する必要はありません。
    const focusedCharacterPoint = {};
    if (this.getFocusedCharacter() === null) {
      focusedCharacterPoint.left = null;
      focusedCharacterPoint.top = null;
    } else {
      const focusedCharacter = this.getFocusedCharacter().getBoundingClientRect();
      const editor = this.editor.getBoundingClientRect();
      focusedCharacterPoint.left = focusedCharacter.left - editor.left;
      focusedCharacterPoint.top = focusedCharacter.top - editor.top;
    }
    this.editor.dispatchEvent(new CustomEvent("custom-moveFocusPoint", {
      detail: {
        left: focusedCharacterPoint.left,
        top: focusedCharacterPoint.top
      }
    }));

    // フォーカスしている行番号と行数の通知処理は値の性質上、後者のほうが先に呼び出される必要があります。
    const currentLength = this.textLines.length;
    if (currentLength !== this.lastDispatchedEventValue.length) {
      this.lastDispatchedEventValue.length = currentLength;
      this.editor.dispatchEvent(new CustomEvent("custom-changeNumberOfTextLines", {
        detail: {
          length: this.lastDispatchedEventValue.length
        }
      }));
    }
    const currentIndex = this.focusedRowIndex;
    if (currentIndex !== this.lastDispatchedEventValue.index) {
      this.lastDispatchedEventValue.index = currentIndex;
      this.editor.dispatchEvent(new CustomEvent("custom-changeFocusedRowIndex", {
        detail: {
          index: this.lastDispatchedEventValue.index
        }
      }));
    }

    // 文字領域の実際の縦幅に対するビューポートの縦幅の割合とスクロール量は値の性質上、
    // 前者のほうが先に呼び出される必要があります。
    const currentViewportHeightRatio = this.textArea.clientHeight / this.textArea.scrollHeight;
    if (currentViewportHeightRatio !== this.lastDispatchedEventValue.viewportHeightRatio) {
      this.lastDispatchedEventValue.viewportHeightRatio = currentViewportHeightRatio;
      this.editor.dispatchEvent(new CustomEvent("custom-changeTextAreaViewportHeightRatio", {
        detail: {
          viewportHeightRatio: this.lastDispatchedEventValue.viewportHeightRatio
        }
      }));
    }
    const currentScrollTop = this.textArea.scrollTop;
    if (currentScrollTop !== this.lastDispatchedEventValue.scrollTop) {
      this.lastDispatchedEventValue.scrollTop = currentScrollTop;
      this.editor.dispatchEvent(new CustomEvent("custom-changeTextAreaScrollTop", {
        detail: {
          scrollTop: this.lastDispatchedEventValue.scrollTop
        }
      }));
    }

    // 文字領域の実際の横幅に対するビューポートの横幅の割合とスクロール量は値の性質上、
    // 前者のほうが先に呼び出される必要があります。
    const currentViewportWidthRatio = this.textArea.clientWidth / this.textArea.scrollWidth;
    if (currentViewportWidthRatio !== this.lastDispatchedEventValue.viewportWidthRatio) {
      this.lastDispatchedEventValue.viewportWidthRatio = currentViewportWidthRatio;
      this.editor.dispatchEvent(new CustomEvent("custom-changeTextAreaViewportWidthRatio", {
        detail: {
          viewportWidthRatio: this.lastDispatchedEventValue.viewportWidthRatio
        }
      }));
    }
    const currentScrollLeft = this.textArea.scrollLeft;
    if (currentScrollLeft !== this.lastDispatchedEventValue.scrollLeft) {
      this.lastDispatchedEventValue.scrollLeft = currentScrollLeft;
      this.editor.dispatchEvent(new CustomEvent("custom-changeTextAreaScrollLeft", {
        detail: {
          scrollLeft: this.lastDispatchedEventValue.scrollLeft
        }
      }));
    }

    // その他の値は順番を気にせず呼びだします。
    const currentSelectingRange = Boolean(this.selectionRange.length);
    if (currentSelectingRange !== this.lastDispatchedEventValue.selecingRange) {
      this.lastDispatchedEventValue.selecingRange = currentSelectingRange;
      this.editor.dispatchEvent(new CustomEvent("custom-changeSelectingRange", {
        detail: {
          selectingRange: this.lastDispatchedEventValue.selecingRange
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
   * 任意の編集履歴を文字領域に反映します。
   * @param {number} index 反映させたい編集履歴を指すインデックスです。
   */
  loadHistory = (index) => {
    if (!this.history.data[index]) {
      return;
    }

    // 反映する編集履歴に保存された文字領域直下のHTML要素の状態を反映してから、
    // 各プロパティへの値の更新を行います。
    this.textArea.textContent = "";
    for (let i = 0; i < this.history.data[index].textLines.length; i += 1) {
      const textLine = this.history.data[index].textLines[i];
      textLine.textContent = "";
      for (const character of this.history.data[index].characters[i]) {
        textLine.appendChild(character);
      }
      this.textArea.appendChild(textLine);
    }

    this.characters = this.history.data[index].characters.map((characters) => {
      return Array.from(characters);
    });
    this.focusedColumnIndex = this.history.data[index].focusedColumnIndex;
    this.focusedRowIndex = this.history.data[index].focusedRowIndex;
    this.textArea.scrollLeft = this.history.data[index].scrollLeft;
    this.textArea.scrollTop = this.history.data[index].scrollTop;
    this.textLines = Array.from(this.history.data[index].textLines);
  };

  /**
   * 矢印キーと移動キーによるフォーカス位置と選択範囲の更新処理です。
   * @param {string} key 押された方向です。
   * @param {boolean} shiftKey Shiftキーが押されているときはtrueになります。
   */
  moveFocusPointByArrowKey = (key, shiftKey) => {
    if (key === "ArrowDown") {
      const goalRowIndex = this.focusedRowIndex + 1;
      const goalColumnIndex = this.focusedColumnIndex;
      while (
        !(this.focusedRowIndex === goalRowIndex && this.focusedColumnIndex === goalColumnIndex) &&
        !(this.focusedRowIndex === goalRowIndex && this.focusedColumnIndex < goalColumnIndex) &&
        !(this.focusedRowIndex === this.getRowsLastIndex() && this.focusedColumnIndex === this.getColumnsLastIndex())
      ) {
        this.moveFocusPointByArrowKey("ArrowRight", shiftKey);
      }
      return;
    }
    if (key === "ArrowLeft") {
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
        if (!this.selectionRange.length) {
          this.selectionRange = [];
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
      }
      return;
    }
    if (key === "ArrowRight") {
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
        if (!this.selectionRange.length) {
          this.selectionRange = [];
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
      }
      return;
    }
    if (key === "ArrowUp") {
      const goalRowIndex = this.focusedRowIndex - 1;
      const goalColumnIndex = this.focusedColumnIndex;
      while (
        !(this.focusedRowIndex === goalRowIndex && this.focusedColumnIndex === goalColumnIndex) &&
        !(this.focusedRowIndex === goalRowIndex && this.focusedColumnIndex < goalColumnIndex) &&
        !(this.focusedRowIndex === 0 && this.focusedColumnIndex === 0)
      ) {
        this.moveFocusPointByArrowKey("ArrowLeft", shiftKey);
      }
      return;
    }
    if (key === "End") {
      for (let i = 0; i < this.getColumnsLastIndex() - this.focusedColumnIndex; i += 1) {
        this.moveFocusPointByArrowKey("ArrowDown", shiftKey);
      }
      return;
    }
    if (key === "Home") {
      for (let i = 0; i < this.focusedColumnIndex; i += 1) {
        this.moveFocusPointByArrowKey("ArrowUp", shiftKey);
      }
      return;
    }
    throw new Error(`想定外の引数です（${key}）。`);
  };

  /**
   * ドラッグ操作（エディター本体でのmousemoveイベント）の対象となったHTML要素に応じて、
   * フォーカス位置を更新するとともに選択範囲を更新します。
   * @param {Element} target イベントの対象となったHTML要素です。
   * @returns {boolean} 対象となるHTML要素が処理の対象だった場合はtrueを返します。
   */
  moveFocusPointByDragTarget = (target) => {

    // まずは対象となるHTML要素からフォーカス位置を求めます。
    // フォーカス対象でない場合、現在のフォーカス位置と対象の位置が同じ場合は処理から抜けます。
    let targetRowIndex;
    let targetColumnIndex;
    if (target.classList.contains("tom-editor__text-area__character")) {
      targetRowIndex = this.textLines.findIndex((textLine) => {
        return textLine === target.parentElement;
      });
      targetColumnIndex = this.characters[targetRowIndex].findIndex((character) => {
        return character === target;
      });
    } else if (target.classList.contains("tom-editor__text-area__text-line")) {
      targetRowIndex = this.textLines.findIndex((textLine) => {
        return textLine === target;
      });
      targetColumnIndex = this.getColumnsLastIndex();
    } else {
      return false;
    }
    if (targetRowIndex === this.focusedRowIndex && targetColumnIndex === this.focusedColumnIndex) {
      return false;
    }

    // 対象が行か文字だったということでフォーカス位置と選択範囲の更新処理を行います。
    while (targetRowIndex < this.focusedRowIndex) {
      this.moveFocusPointByArrowKey("ArrowUp", true);
    }
    while (targetRowIndex > this.focusedRowIndex) {
      this.moveFocusPointByArrowKey("ArrowDown", true);
    }
    while (targetColumnIndex < this.focusedColumnIndex) {
      this.moveFocusPointByArrowKey("ArrowLeft", true);
    }
    while (targetColumnIndex > this.focusedColumnIndex) {
      this.moveFocusPointByArrowKey("ArrowRight", true);
    }

    return true;
  };

  /**
   * mousedownイベントが発生したHTML要素に応じてフォーカス位置を更新します。
   * @param {Event} event mousedownイベントのEventオブジェクトです。
   */
  moveFocusPointByMousedownTarget = (event) => {

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

    // 行がクリックされたときは当該行の行末文字をフォーカス位置とします。
    if (event.target.classList.contains("tom-editor__text-area__text-line")) {
      this.focusedRowIndex = this.textLines.findIndex((textLine) => {
        return textLine === event.target;
      });
      this.focusedColumnIndex = this.getColumnsLastIndex();
      return;
    }
  };

  /**
   * キャレット上で押されたキーに応じた処理を実行します。
   * 一部のキー処理で非同期のClipboard APIを利用しているため、
   * その他同期的なキー入力処理と同じ使い勝手になるように全体をPromiseで囲って非同期処理化しています。
   * @param {Event} event EventTarget.addEventListenerメソッドから取得したイベント情報です。
   * @returns {Promise} 押されたキーが有効だった場合はtrueを返します。
   */
  reflectKey = (event) => {
    return new Promise(async (resolve) => {

      // Ctrlキーが押されている間はショートカット処理の制御のみを行います。
      if (event.detail.ctrlKey) {

        // Ctrl + aで全文選択です。
        // フォーカス位置は文末になります。
        if (event.detail.key === "a") {
          this.selectionRange = this.characters.map((characters) => {
            return Array.from(characters);
          });
          this.selectionRange[this.selectionRange.length - 1].pop();
          for (const characters of this.selectionRange) {
            for (const character of characters) {
              character.classList.add("tom-editor__text-area__character--select");
            }
          }
          this.focusedRowIndex = this.getRowsLastIndex();
          this.focusedColumnIndex = this.getColumnsLastIndex();
          return resolve(true);
        }

        // Ctrl + cで範囲選択中の文字をクリップボードにコピーします。
        if (event.detail.key === "c") {
          const convertedText = this.convertSelectedRangeIntoText(false);
          await navigator.clipboard.writeText(convertedText);
          return resolve(true);
        }

        // Ctrl + vでクリップボードの文字を文字領域にペーストします。
        if (event.detail.key === "v") {

          // Firefoxではnavigator.clipboard.readTextメソッドはブラウザの拡張機能でのみ機能します。
          if (!navigator.clipboard.readText) {
            alert("【！ 申し訳ございません ！】\nお使いのブラウザではペースト機能は非対応となっております。\nペースト機能をご利用いただく場合は別のブラウザでお願いします。");
            return resolve(false);
          }

          await navigator.clipboard.readText().then((textInClipboard) => {
            if (this.selectionRange.length) {
              this.removeCharactersInSelectionRange();
            }
            for (const character of textInClipboard) {

              // Async Clipboard APIで改行を取得すると「\n」ではなく「\r」「\n」の2文字で表現されます。
              // そのままDOMに突っ込むと2回改行されてしまうため「\r」は無視するようにします。
              if (character === "\r") {
                continue;
              }

              if (character === "\n") {
                const deleteCount = this.getColumnsLastIndex() - this.focusedColumnIndex;
                this.appendTextLine(this.characters[this.focusedRowIndex].splice(this.focusedColumnIndex, deleteCount));
                continue;
              }
              this.appendCharacter(character);
            }
          });
          return resolve(true);
        }

        // Ctrl + xで選択範囲中の文字をカットします。
        if (event.detail.key === "x") {
          const convertedText = this.convertSelectedRangeIntoText(true);
          await navigator.clipboard.writeText(convertedText);
          return resolve(true);
        }

        // Ctrl + yで1つ後の編集状態に移動します。
        if (event.detail.key === "y") {
          if (!this.history.data[this.history.index + 1]) {
            return resolve(false);
          }
          this.history.index += 1;
          this.loadHistory(this.history.index);
          return resolve(true);
        }

        // Ctrl + zで1つ前の編集状態に移動します。
        if (event.detail.key === "z") {
          if (!this.history.data[this.history.index - 1]) {
            return resolve(false);
          }
          this.history.index -= 1;
          this.loadHistory(this.history.index);
          return resolve(true);
        }

        // Ctrlキーが押されている間はショートカット処理の制御のみを行います。
        // その他キー処理は実行せず、ここで処理から抜けます。
        return resolve(false);
      }

      // 文字入力処理です。
      // 範囲選択がされているならばShiftキーが押されているかどうかを問わず、選択範囲を削除します。
      if (event.detail.key.length === 1) {
        if (this.selectionRange.length) {
          this.removeCharactersInSelectionRange();
        }
        this.appendCharacter(event.detail.key);
        return resolve(true);
      }

      // 矢印キーと移動キーによるフォーカス位置の変更と範囲選択の更新処理です。
      // 範囲選択がされている状態でShiftキーを押さずに矢印キーが押された場合は、選択範囲の解除だけを行います。
      if (event.detail.key.includes("Arrow") || ["End", "Home"].includes(event.detail.key)) {
        if (!event.detail.shiftKey && this.selectionRange.length) {
          this.unselctRange();
        } else {
          this.moveFocusPointByArrowKey(event.detail.key, event.detail.shiftKey);
        }
        return resolve(true);
      }

      // BackspaceキーとDeleteキーによる、文字あるいは選択範囲の削除処理です。
      // 範囲選択がされているならばShiftキーが押されているかどうかを問わず、選択範囲を削除します。
      if (["Backspace", "Delete"].includes(event.detail.key)) {
        if (this.selectionRange.length) {
          this.removeCharactersInSelectionRange();
        } else {
          this.removeCharacter(event.detail.key);
        }
        return resolve(true);
      }

      // その他キー入力です。
      if (event.detail.key === "Enter") {
        if (!event.detail.shiftKey && this.selectionRange.length) {
          this.removeCharactersInSelectionRange();
        }
        const deleteCount = this.getColumnsLastIndex() - this.focusedColumnIndex;
        this.appendTextLine(this.characters[this.focusedRowIndex].splice(this.focusedColumnIndex, deleteCount));
        return resolve(true);
      }
      if (event.detail.key === "Tab") {
        if (event.detail.shiftKey) {
          return resolve(false);
        }
        if (this.selectionRange.length) {
          this.removeCharactersInSelectionRange();
        }
        const tab = "    ";
        for (const character of tab) {
          this.appendCharacter(character);
        }
        return resolve(true);
      }

      return resolve(false);
    });
  };

  /**
   * Backspaceキー、あるいはDeleteキーによる文字削除処理を実行します。
   * @param {string} key 押されたキーです。
   */
  removeCharacter = (key) => {
    if (key === "Backspace") {
      if (this.focusedColumnIndex === 0) {
        if (this.focusedRowIndex === 0) {
          return;
        }
        this.focusedRowIndex -= 1;
        this.focusedColumnIndex = this.getColumnsLastIndex();
        this.removeTextLine();
        return;
      }
      this.focusedColumnIndex -= 1;
      this.characters[this.focusedRowIndex].splice(this.focusedColumnIndex, 1)[0].remove();
      return;
    }
    if (key === "Delete") {
      if (this.focusedColumnIndex === this.getColumnsLastIndex()) {
        if (this.focusedRowIndex === this.getRowsLastIndex()) {
          return;
        }
        this.removeTextLine();
        return;
      }
      this.characters[this.focusedRowIndex].splice(this.focusedColumnIndex, 1)[0].remove();
      return;
    }
    throw new Error(`想定外の引数です（${key}）。`);
  };

  /**
   * 範囲選択された文字を全て削除します。
   */
  removeCharactersInSelectionRange = () => {
    let numberOfCharacters = 0;
    for (const row of this.selectionRange) {
      numberOfCharacters += row.length;
    }
    if (this.getFocusedCharacter().classList.contains("tom-editor__text-area__character--select")) {
      for (let i = 0; i < numberOfCharacters; i += 1) {
        this.removeCharacter("Delete");
      }
    } else {
      for (let i = 0; i < numberOfCharacters; i += 1) {
        this.removeCharacter("Backspace");
      }
    }
    this.selectionRange = [];
    return;
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
   * 編集履歴を保存します。
   */
  saveHistory = () => {

    // 初期化時の処理です。
    if (typeof this.history === "undefined") {
      this.history = {
        data: [{
          characters: this.characters.map((characters) => {
            return Array.from(characters);
          }),
          focusedColumnIndex: 0,
          focusedRowIndex: 0,
          scrollLeft: 0,
          scrollTop: 0,
          textLines: Array.from(this.textLines)
        }],
        index: 0
      };
      return;
    }

    // 現在の状態が編集履歴の最新となるように保存します。
    // Redo中ならば未来の履歴は全て削除します。
    this.history.data.splice(this.history.index + 1);
    this.history.data.push({
      characters: this.characters.map((characters) => {
        return Array.from(characters);
      }),
      focusedColumnIndex: this.focusedColumnIndex,
      focusedRowIndex: this.focusedRowIndex,
      scrollLeft: this.textArea.scrollLeft,
      scrollTop: this.textArea.scrollTop,
      textLines: Array.from(this.textLines)
    });
    this.history.index += 1;
  };

  /**
   * 現在のフォーカス位置がビューポート外や見えにくい位置にあるときは自動的にスクロールします。
   */
  scrollAutomatically = () => {

    // 自動スクロールはフォーカスされた文字が文字領域外に出たときには必ず実行されます。
    // ただ、それだと当該文字が文字領域縁ギリギリのところに置かれつづけるために視認性が悪いという問題が残ります、
    // そこで、いくらか内側にも処理の対象範囲を広げています。
    // 以下4つの変数は上下左右の対象範囲を何文字分広げるかという値です。
    const innerRangeTop = 0.5;
    const innerRangeBottom = 1.5;
    const innerRangeLeft = 1.5;
    const innerRangeRight = 2.5;

    const focusedCharacterRect = this.getFocusedCharacter().getBoundingClientRect();
    const textAreaRect = this.textArea.getBoundingClientRect();
    if (focusedCharacterRect.top < textAreaRect.top + focusedCharacterRect.height * innerRangeTop) {
      this.textArea.scrollTop -= (textAreaRect.top + focusedCharacterRect.height * innerRangeTop) - focusedCharacterRect.top;
    } else if (focusedCharacterRect.bottom > textAreaRect.bottom - focusedCharacterRect.height * innerRangeBottom) {
      this.textArea.scrollTop += focusedCharacterRect.bottom - (textAreaRect.bottom - focusedCharacterRect.height * innerRangeBottom);
    }
    if (focusedCharacterRect.left < textAreaRect.left + focusedCharacterRect.width * innerRangeLeft) {
      this.textArea.scrollLeft -= (textAreaRect.left + focusedCharacterRect.width * innerRangeLeft) - focusedCharacterRect.left;
    } else if (focusedCharacterRect.right > textAreaRect.right - focusedCharacterRect.width * innerRangeRight) {
      this.textArea.scrollLeft += focusedCharacterRect.right - (textAreaRect.right - focusedCharacterRect.width * innerRangeRight);
    }
  };

  /**
   * イベントリスナーを実装します。
   * @param {boolean} readonlyFlag 読みとり専用状態にするならばtrueが入っています。
   */
  setEventListeners = (readonlyFlag) => {

    // エディターの横幅が変化したので、変更後の状態を通知します。
    this.editor.addEventListener("custom-resizeTextAreaHeight", () => {
      this.dispatchEvents();
    });

    // エディターの横幅が変化したので、文字領域の横幅を調整します。
    this.editor.addEventListener("custom-resizeTextAreaWidth", (event) => {
      this.textArea.style.maxWidth = `${event.detail.width}px`;
      this.dispatchEvents();
    });

    // 水平スクロール操作が発生しましたので、垂直スクロール量を文字領域に反映します。
    // event.detail.scrollRatioは比率スクロール、event.detail.scrollSizeは絶対値でのスクロールです。
    this.editor.addEventListener("custom-scrollHorizontally", (event) => {
      if (event.detail.hasOwnProperty("scrollSize")) {
        this.textArea.scrollLeft += event.detail.scrollSize;
      } else if (event.detail.hasOwnProperty("scrollRatio")) {
        this.textArea.scrollLeft += event.detail.scrollRatio / this.textArea.clientWidth * this.textArea.scrollWidth;
      } else {
        return;
      }      
      this.dispatchEvents();
    });

    // 垂直スクロール操作が発生しましたので、垂直スクロール量を文字領域に反映します。
    // event.detail.scrollRatioは比率スクロール、event.detail.scrollSizeは絶対値でのスクロールです。
    this.editor.addEventListener("custom-scrollVertically", (event) => {
      if (event.detail.hasOwnProperty("scrollSize")) {
        this.textArea.scrollTop += event.detail.scrollSize;
      } else if (event.detail.hasOwnProperty("scrollRatio")) {
        this.textArea.scrollTop += event.detail.scrollRatio / this.textArea.clientHeight * this.textArea.scrollHeight;
      } else {
        return;
      }
      this.dispatchEvents();
    });

    // 読みとり専用状態にする場合は一部のイベントリスナーを省略します。
    // 以下、読み取り専用状態時は省略する値やイベントリスナーです。
    if (!readonlyFlag) {

      // IMEによる入力処理の状態や値をまとめたオブジェクトです。
      const compositionState = {
        lastData: null,
        startColumnIndex: null,
        startSelectionStart: null
      };

      // IMEによる入力処理のフラグです。
      let isComposing = false;

      // マウスドラッグによる範囲選択処理のフラグです。
      let isDragging = false;

      // 文字領域がクリックされたので、クリックされた場所に応じてフォーカス位置を更新します。
      // また、範囲選択状態にあるならば当該状態を解除するとともにマウスドラッグ処理のフラグを立てます。
      this.textArea.addEventListener("mousedown", (event) => {
        isDragging = true;
        this.unselctRange();
        this.moveFocusPointByMousedownTarget(event);
        this.scrollAutomatically();
        this.dispatchEvents();
      });

      // キャレットが外れたので、フォーカスも外します。
      this.editor.addEventListener("custom-blur", () => {
        this.unselctRange();
        this.focusedRowIndex = null;
        this.focusedColumnIndex = null;
        this.dispatchEvents();
      });

      // IMEによる入力処理のフラグを下ろし、当該処理に関する値を消去します。
      this.editor.addEventListener("custom-compositionend", () => {
        isComposing = false;
        compositionState.lastData = null;
        compositionState.startColumnIndex = null;
        compositionState.startSelectionStart = null;
        if (this.differenceBetweenCurrentAndHistory()) {
          this.saveHistory();
        }
      });

      // IMEによる入力処理のフラグを立て、当該処理に関する値を初期化します。
      this.editor.addEventListener("custom-compositionstart", () => {
        isComposing = true;
        compositionState.lastData = "";
        compositionState.startColumnIndex = this.focusedColumnIndex;
        compositionState.startSelectionStart = null;
      });

      // 行番号のドラッグ操作による範囲選択処理を実行します。
      this.editor.addEventListener("custom-dragLineNumber", (event) => {
        while (event.detail.index < this.focusedRowIndex - 1) {
          this.moveFocusPointByArrowKey("ArrowUp", true);
        }
        while (event.detail.index > this.focusedRowIndex - 1) {
          this.moveFocusPointByArrowKey("ArrowDown", true);
          if (this.focusedRowIndex === this.getRowsLastIndex()) {
            break;
          }
        }
        this.scrollAutomatically();
        this.dispatchEvents();
      });

      // IMEによる入力処理中のみ走る専用の入力処理を実行します。
      this.editor.addEventListener("custom-input", (event) => {
        if (!isComposing) {
          return;
        }

        // IME入力処理の最初の入力時におけるHTMLInputElement.selectionStartプロパティを取得します。
        // 当処理中のフォーカス位置を特定するのに当該プロパティ（の処理開始時点での値）が必要になります。
        if (compositionState.startSelectionStart === null) {
          compositionState.startSelectionStart = event.detail.selectionStart - event.detail.data.length;
        }

        // 変換内容が変わっている場合はHTMLを書きかえます。
        // 入力されている内容を全て消してから最新の状態に上書きします。
        if (event.detail.data !== compositionState.lastData) {
          this.focusedColumnIndex = compositionState.startColumnIndex;
          for (let i = 0; i < compositionState.lastData.length; i += 1) {
            this.removeCharacter("Delete");
          }
          compositionState.lastData = event.detail.data;
          if (compositionState.lastData !== null) {
            for (const character of compositionState.lastData) {
              this.appendCharacter(character);
            }
          }
        }

        // フォーカス位置を更新します。
        this.focusedColumnIndex = compositionState.startColumnIndex;
        for (let i = 0; i < event.detail.selectionStart - compositionState.startSelectionStart; i += 1) {
          this.moveFocusPointByArrowKey("ArrowRight", false);
        }

        this.scrollAutomatically();
        this.dispatchEvents();
      });

      // キャレットにキー入力があったので、押されたキーに応じた処理を実行します。
      this.editor.addEventListener("custom-keydown", async (event) => {
        if (isComposing) {
          return;
        }
        if (!await this.reflectKey(event)) {
          return;
        }
        this.scrollAutomatically();
        if (this.differenceBetweenCurrentAndHistory()) {
          this.saveHistory();
        }
        this.dispatchEvents();
      });

      // 行番号のクリック操作による範囲選択処理を開始します。
      this.editor.addEventListener("custom-mousedonwLineNumber", (event) => {
        this.unselctRange();
        this.focusedRowIndex = event.detail.index;
        this.focusedColumnIndex = 0;
        this.moveFocusPointByArrowKey("ArrowDown", true);
        this.scrollAutomatically();
        this.dispatchEvents();
      });

      // フラグが立っているならば、マウスドラッグ処理を実行します。
      this.editor.addEventListener("custom-mousemove", (event) => {
        if (!isDragging) {
          return;
        }
        this.moveFocusPointByDragTarget(event.detail.target);
        this.dispatchEvents();
      });

      // マウスドラッグ処理のフラグを下ろします。
      this.editor.addEventListener("custom-mouseup", () => {
        isDragging = false;
        this.dispatchEvents();
      });
    }
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
};

export {
  TextArea
}
