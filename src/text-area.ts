/**
 * 文字領域を制御します。
 * @param {Main} root ライブラリのエントリポイントです。
 * @param {boolean} readonlyFlag 読みとり専用状態ならばtrueが入ります。
 */
const TextArea = class {
  constructor(root: Main, readonlyFlag: boolean) {
    this.root = root;
    this.readonlyFlag = readonlyFlag;
    this.compositionState = {
      isComposing: false,
      lastData: null,
      startColumnIndex: null,
      startSelectionStart: null
    };
    this.focusPointIndex = {
      column: null,
      row: null
    };
    this.isDragging = false;
    this.lastDispatchedEventValue = {
      focusedRowIndex: null,
      height: 0,
      numberOfTextLines: 1,
      scrollLeft: 0,
      scrollTop: 0,
      selectingRange: false,
      viewportHeightRatio: 1,
      viewportWidthRatio: 1,
      width: 0
    };
    this.selectionRange = [];
    this.styleClass = {
      character: {
        element: "tom-editor__text-area__character",
        modifier: {
          eol: "tom-editor__text-area__character--eol",
          select: "tom-editor__text-area__character--select"
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
    this.textAreaContentList = [{
      characterList: [eolOfFirstTextLine],
      textLine: firstTextLine
    }];
    this.saveHistory();
    this.definePublishingEventListeners();
    this.defineSubscribingEventListeners();
  }

  /** IMEによる入力処理の状態や値をまとめたオブジェクトです。 */
  compositionState: CompositionState;

  /** @type {FocusPointIndex} フォーカスしている位置を表すインデックス値をまとめたオブジェクトです。 */
  focusPointIndex: FocusPointIndex;

  /** @type {TextAreaHistoryList} 文字領域の変更状態をまとめたオブジェクトです。 */
  history!: TextAreaHistoryList;

  /** @type {boolean} ドラッグ中ならばtrueが入ります。 */
  isDragging: boolean;

  /** @type {LastDispatchedEventValue} 最後に発信された値をまとめたオブジェクトです。 */
  lastDispatchedEventValue: LastDispatchedEventValue;

  /** @type {boolean} 読みとり専用状態ならばtrueが入ります。 */
  readonlyFlag: boolean;

  /** @type {Main} ライブラリのエントリポイントです。 */
  root: Main;

  /** @type {HTMLSpanElement[][]} 範囲選択中の文字をまとめた配列です。 */
  selectionRange: HTMLSpanElement[][];

  /** @type {TextAreaStyleClass} 当クラスで使用するCSSクラスをまとめたオブジェクトです。 */
  styleClass: TextAreaStyleClass;

  /** @type {HTMLDivElement} 文字領域です。 */
  textArea: HTMLDivElement;

  /** @type {TextAreaContent} Webページに挿入中の行と文字をまとめたオブジェクトです。 */
  textAreaContentList: TextAreaContent[];

  /** @type {HTMLDivElement} 行のラッパー要素です。 */
  textLinesWrapper: HTMLDivElement;

  /**
   * 引数に指定された文字を文章に挿入します。
   * @param {string} textContent 挿入対象となる文字です。
   */
  appendCharacter = (textContent: string): void => {
    const character = this.createCharacter(textContent);
    if (this.focusPointIndex.row === null || this.focusPointIndex.column === null) {
      throw new Error("TextArea.prototype.appendCharacter: フォーカスされていません。");
    }
    this.textAreaContentList[this.focusPointIndex.row].characterList.splice(this.focusPointIndex.column, 0, character);
    this.focusPointIndex.column += 1;
    this.getFocusedCharacter().before(character);
  };

  /**
   * 文字領域に新規行を挿入します。
   * @param {HTMLSpanElement[]} initialCharacterList 行に最初から含める文字です。
   */
  appendTextLine = (initialCharacterList: HTMLSpanElement[]): void => {
    if (this.focusPointIndex.row === null || this.focusPointIndex.column === null) {
      throw new Error("TextArea.prototype.appendTextLine: フォーカスされていません。");
    }

    // 行と文字を生成します。
    const textLine = this.createTextLine();
    const eol = this.createCharacter("eol");
    initialCharacterList.push(eol);
    for (const character of initialCharacterList) {
      textLine.appendChild(character);
    }
    const textAreaContent = {
      characterList: initialCharacterList,
      textLine: textLine
    };
    this.textAreaContentList.splice(this.focusPointIndex.row + 1, 0, textAreaContent);

    // Webページに生成したHTML要素を挿入します。
    this.textAreaContentList[this.focusPointIndex.row].textLine.after(textLine);

    // フォーカス位置を更新します。
    this.focusPointIndex.row += 1;
    this.focusPointIndex.column = 0;
  };

  /**
   * 選択範囲に含まれている文字を表すHTML要素群を文字列に変換します。
   * @param {boolean} cutFlag 変換時に範囲選択した範囲を削除するかどうかのフラグです。
   * @returns {string} 文字列化した範囲選択された値です。
   */
  convertSelectedRangeIntoText = (cutFlag: boolean): string => {
    let convertedText = "";
    if (this.selectionRange.length) {

      // 選択範囲が複数行にまたがるとき、最後の行以外の末尾文字が選択範囲に含まれていますので改行文字に置きかえます。
      for (const textLine of this.selectionRange) {
        for (const character of textLine) {
          if (character.classList.contains(this.styleClass.character.modifier.eol)) {
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
   * 出版用イベントリスナーを定義します。
   */
  definePublishingEventListeners = (): void => {

    // エディターの寸法が変化したのを検知したら、その旨を発信します。
    new ResizeObserver(() => {
      this.dispatchEvents();
    }).observe(this.textArea);

    // 読みとり専用状態にする場合は一部のイベントリスナーを省略します。
    if (this.readonlyFlag) {
      return;
    }

    // 文字領域がクリックされたので、クリックされた場所に応じてフォーカス位置を更新します。
    // また、範囲選択状態にあるならば当該状態を解除するとともにマウスドラッグ処理のフラグを立てます。
    this.textArea.addEventListener("mousedown", (event): void => {
      this.isDragging = true;
      this.unselctRange();
      this.moveFocusPointByMousedownTarget(event);
      this.scrollAutomatically();
      this.dispatchEvents();
    });
  };

  /**
   * 購読用イベントリスナーを定義します。
   */
  defineSubscribingEventListeners = (): void => {

    // 水平スクロールバーがドラッグされたので、ドラッグ距離のぶんだけ水平スクロールします。
    this.root.addEventListener("TOMEditor-draghorizontalscrollbar", (event: CustomEventInit<TOMEditorDragHorizontalScrollbarEvent>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("TextArea.prototype.defineSubscribingEventListeners: TOMEditor-draghorizontalscrollbarイベントのdetailプロパティが空です。");
      }
      this.textArea.scrollLeft += event.detail.distance / this.textArea.clientWidth * this.textArea.scrollWidth;
      this.dispatchEvents();
    });

    // 垂直スクロールバーがドラッグされたので、ドラッグ距離のぶんだけ垂直スクロールします。
    this.root.addEventListener("TOMEditor-dragverticalscrollbar", (event: CustomEventInit<TOMEditorDragVerticalScrollbarEvent>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("TextArea.prototype.defineSubscribingEventListeners: TOMEditor-dragverticalscrollbarイベントのdetailプロパティが空です。");
      }
      this.textArea.scrollTop += event.detail.distance / this.textArea.clientHeight * this.textArea.scrollHeight;
      this.dispatchEvents();
    });

    // 第1次初期化処理を実行します。
    this.root.addEventListener("TOMEditor-firstinitialize", (event: CustomEventInit<TOMEditorFirstInitializeEvent>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("TextArea.prototype.defineSubscribingEventListeners: TOMEditor-initializeイベントのdetailプロパティが空です。");
      }
      event.detail.editor.appendChild(this.textArea);
      this.dispatchEvents();
    });

    // 水平スクロールイベントが発生しましたので、文字領域を通知された値に応じて水平スクロールします。
    this.root.addEventListener("TOMEditor-horizontalscroll", (event: CustomEventInit<TOMEditorHorizontalScrollEvent>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("TextArea.prototype.defineSubscribingEventListeners: TOMEditor-horizontalscrollイベントのdetailプロパティが空です。");
      }
      this.textArea.scrollLeft += event.detail.scrollSize;
    });

    // 垂直スクロールイベントが発生しましたので、文字領域を通知された値に応じて垂直スクロールします。
    this.root.addEventListener("TOMEditor-verticalscroll", (event: CustomEventInit<TOMEditorVerticalScrollEvent>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("TextArea.prototype.defineSubscribingEventListeners: TOMEditor-verticalscrollイベントのdetailプロパティが空です。");
      }
      this.textArea.scrollTop += event.detail.scrollSize;
      this.dispatchEvents();
    });

    // 読みとり専用状態にする場合は一部のイベントリスナーを省略します。
    if (this.readonlyFlag) {
      return;
    }

    // キャレットが外れたので、フォーカス位置も解除します。
    this.root.addEventListener("TOMEditor-blur", (): void => {
      this.unselctRange();
      this.focusPointIndex = {
        column: null,
        row: null
      };
      this.dispatchEvents();
    });

    // IMEによる入力処理のフラグを下ろし、当該処理に関する値を消去します。
    this.root.addEventListener("TOMEditor-compositionend", (): void => {
      this.compositionState = {
        isComposing: false,
        lastData: null,
        startColumnIndex: null,
        startSelectionStart: null
      };
      if (this.differenceBetweenCurrentAndHistory()) {
        this.saveHistory();
      }
    });

    // IMEによる入力処理のフラグを立て、当該処理に関する値を初期化します。
    this.root.addEventListener("TOMEditor-compositionstart", (): void => {
      this.compositionState = {
        isComposing: true,
        lastData: "",
        startColumnIndex: this.focusPointIndex.column,
        startSelectionStart: null
      };
    });

    // 行番号領域でドラッグ操作処理が行われたので、そちらに合わせて範囲選択処理を実行します。
    this.root.addEventListener("TOMEditor-draglinenumber", (event: CustomEventInit<TOMEditorDragLineNumberEvent>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("TextArea.prototype.defineSubscribingEventListeners: TOMEditor-draglinenumberイベントのdetailプロパティが空です。");
      }
      if (this.focusPointIndex.row === null) {
        throw new Error("TextArea.prototype.defineSubscribingEventListeners: this.focusPointIndex.rowがnullです。");
      }
      const processingTime = Math.abs(event.detail.draggedIndex - this.focusPointIndex.row - 1);
      if (event.detail.draggedIndex < this.focusPointIndex.row - 1) {
        for (let i = 0; i < processingTime - 2; i += 1) {
          this.moveFocusPointByKey("ArrowUp", true);
        }
      } else if (event.detail.draggedIndex > this.focusPointIndex.row - 1) {
        for (let i = 0; i < processingTime; i += 1) {
          this.moveFocusPointByKey("ArrowDown", true);
        }
      }
      this.scrollAutomatically();
      this.dispatchEvents();
    });

    // TOMEditor-keydownイベントとは違い、TOMEditor-inputイベントは日本語入力処理用のイベントリスナーです。
    this.root.addEventListener("TOMEditor-input", (event: CustomEventInit<TOMEditorInputEvent>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("TextArea.prototype.defineSubscribingEventListeners: TOMEditor-inputイベントのdetailプロパティが空です。");
      }
      if (!this.compositionState.isComposing) {
        return;
      }

      // IME入力処理の最初の入力時におけるHTMLInputElement.selectionStartプロパティを取得します。
      // 当処理中のフォーカス位置を特定するのに当該プロパティ（の処理開始時点での値）が必要になります。
      if (this.compositionState.startSelectionStart === null) {
        this.compositionState.startSelectionStart = event.detail.selectionStart - event.detail.data.length;
      }

      // 変換内容が変わっている場合はHTMLを書きかえます。
      // 入力されている内容を全て消してから最新の状態に上書きします。
      if (event.detail.data !== this.compositionState.lastData) {
        this.focusPointIndex.column = this.compositionState.startColumnIndex;
        if (this.compositionState.lastData === null) {
          throw new Error("TextArea.prototype.defineSubscribingEventListeners: TOMEditorInputEvent.lastDataがnullです。");
        }
        for (let i = 0; i < this.compositionState.lastData.length; i += 1) {
          this.removeCharacter("Delete");
        }
        this.compositionState.lastData = event.detail.data;
        if (this.compositionState.lastData !== null) {
          for (const character of this.compositionState.lastData) {
            this.appendCharacter(character);
          }
        }
      }

      // フォーカス位置を更新します。
      this.focusPointIndex.column = this.compositionState.startColumnIndex;
      for (let i = 0; i < event.detail.selectionStart - this.compositionState.startSelectionStart; i += 1) {
        this.moveFocusPointByKey("ArrowRight", false);
      }

      this.scrollAutomatically();
      this.dispatchEvents();
    });

    // TOMEditor-inputイベントとは違い、TOMEditor-keydownイベントは半角英数字入力処理用のイベントリスナーです。
    this.root.addEventListener("TOMEditor-keydown", async (event: CustomEventInit<TOMEditorKeyDownEvent>): Promise<void> => {
      if (typeof event.detail === "undefined") {
        throw new Error("TextArea.prototype.defineSubscribingEventListeners: TOMEditor-keydownイベントのdetailプロパティが空です。");
      }
      if (this.compositionState.isComposing) {
        return;
      }
      if (!await this.reflectKey(event.detail.key, event.detail.shiftKey, event.detail.ctrlKey)) {
        return;
      }
      this.scrollAutomatically();
      if (this.differenceBetweenCurrentAndHistory()) {
        this.saveHistory();
      }
      this.dispatchEvents();
    });

    // 行番号がクリックされたので、クリックされた行番号に応じた範囲選択処理を開始します。
    this.root.addEventListener("TOMEditor-mousedownlinenumber", (event: CustomEventInit<TOMEditorMouseDownLineNumber>) => {
      if (typeof event.detail === "undefined") {
        throw new Error("TextArea.prototype.defineSubscribingEventListeners: TOMEditor-mousedownlinenumberイベントのdetailプロパティが空です。");
      }
      this.unselctRange();
      this.focusPointIndex = {
        column: 0,
        row: event.detail.lineNumberIndex
      };
      this.moveFocusPointByKey("ArrowDown", true);
      this.scrollAutomatically();
      this.dispatchEvents();
    });

    // ドラッグ操作フラグが立っているならば、マウスドラッグ操作処理を実行します。
    this.root.addEventListener("TOMEditor-mousemove", (event: CustomEventInit<TOMEditorMouseMoveEvent>) => {
      if (typeof event.detail === "undefined") {
        throw new Error("TextArea.prototype.defineSubscribingEventListeners: TOMEditor-mousemoveイベントのdetailプロパティが空です。");
      }
      if (!this.isDragging) {
        return;
      }
      this.moveFocusPointByDragTarget(event.detail.target);
      this.scrollAutomatically();
      this.dispatchEvents();
    });

    // マウスドラッグ操作処理のフラグを下ろします。
    this.root.addEventListener("TOMEditor-mouseup", () => {
      this.isDragging = false;
      this.dispatchEvents();
    });
  };

  /**
   * 現在の入力内容と現在表示中の編集履歴の入力内容の間に差異があるかを確認します。
   * 確認にはMutationObserverオブジェクトが使えると思ったのですが、
   * 当該オブジェクトを使用した監視は少しでも変更があるたびに走ってしまうので、
   * ペースト処理や日本語入力処理などとの相性が悪いと判断して独自の変更検知処理を用意しました。
   * @returns {boolean} 差異がある場合はtrueを返します。
   */
  differenceBetweenCurrentAndHistory = (): boolean => {

    // 行数が異なる場合は差異があると見なします。
    if (this.textAreaContentList.length !== this.history.data[this.history.index].textAreaContentList.length) {
      return true;
    }

    // 各行の中身を見ていきます。
    for (let i = 0; i < this.textAreaContentList.length; i += 1) {

      // 1行あたりの文字数が異なる場合も差異があると見なします。
      if (this.textAreaContentList[i].characterList.length !== this.history.data[this.history.index].textAreaContentList[i].characterList.length) {
        return true;
      }

      // 行数に差異がなく、1行あたりの文字数も同じなので1文字ずつ突合させていきます。
      for (let j = 0; j < this.textAreaContentList[i].characterList.length; j += 1) {
        if (this.textAreaContentList[i].characterList[j] !== this.history.data[this.history.index].textAreaContentList[i].characterList[j]) {
          return true;
        }
      }
    }

    return false;
  };

  /**
   * カスタムイベントを発信します。
   */
  dispatchEvents = (): void => {

    // フォーカス座標の通知処理は変更の有無を問わず通知します。
    // そのため最後に送信されたときの値を保存する必要はありません。
    const focusedCharacterPoint: TOMEditorMoveFocusPointPositionEvent = {
      left: null,
      top: null
    };
    if (this.focusPointIndex.row !== null && this.focusPointIndex.column !== null) {
      const focusedCharacter = this.getFocusedCharacter();
      focusedCharacterPoint.left = focusedCharacter.offsetLeft - this.textArea.scrollLeft;
      focusedCharacterPoint.top = focusedCharacter.offsetTop - this.textArea.scrollTop;
    }
    this.root.dispatchEvent(new CustomEvent("TOMEditor-movefocuspointposition", {
      detail: focusedCharacterPoint
    }));

    // フォーカスしている行番号と行数の通知処理は値の性質上、後者のほうが先に呼び出される必要があります。
    const currentLength = this.textAreaContentList.length;
    if (currentLength !== this.lastDispatchedEventValue.numberOfTextLines) {
      this.lastDispatchedEventValue.numberOfTextLines = currentLength;
      this.root.dispatchEvent(new CustomEvent("TOMEditor-changenumberoftextlines", {
        detail: {
          numberOfTextLines: this.lastDispatchedEventValue.numberOfTextLines
        } as TOMEditorChangeNumberOfTextLinesEvent
      }));
    }
    const currentIndex = this.focusPointIndex.row;
    if (currentIndex !== this.lastDispatchedEventValue.focusedRowIndex) {
      this.lastDispatchedEventValue.focusedRowIndex = currentIndex;
      this.root.dispatchEvent(new CustomEvent("TOMEditor-changefocusedrowindex", {
        detail: {
          focusedRowIndex: this.lastDispatchedEventValue.focusedRowIndex
        } as TOMEditorChangeFocusedRowIndexEvent
      }));
    }

    // 文字領域の実際の縦幅に対するビューポートの縦幅の割合とスクロール量は値の性質上、
    // 前者のほうが先に呼び出される必要があります。
    const currentViewportHeightRatio = this.textArea.clientHeight / this.textArea.scrollHeight;
    if (currentViewportHeightRatio !== this.lastDispatchedEventValue.viewportHeightRatio) {
      this.lastDispatchedEventValue.viewportHeightRatio = currentViewportHeightRatio;
      this.root.dispatchEvent(new CustomEvent("TOMEditor-changetextareaviewportheightratio", {
        detail: {
          viewportHeightRatio: this.lastDispatchedEventValue.viewportHeightRatio
        } as TOMEditorChangeTextAreaViewportHeightRatio
      }));
    }
    const currentScrollTop = this.textArea.scrollTop;
    if (currentScrollTop !== this.lastDispatchedEventValue.scrollTop) {
      this.lastDispatchedEventValue.scrollTop = currentScrollTop;
      this.root.dispatchEvent(new CustomEvent("TOMEditor-changetextareascrolltop", {
        detail: {
          scrollTop: this.lastDispatchedEventValue.scrollTop
        } as TOMEditorChangeTextAreaScrollTop
      }));
    }

    // 文字領域の実際の横幅に対するビューポートの横幅の割合とスクロール量は値の性質上、
    // 前者のほうが先に呼び出される必要があります。
    const currentViewportWidthRatio = this.textArea.clientWidth / this.textArea.scrollWidth;
    if (currentViewportWidthRatio !== this.lastDispatchedEventValue.viewportWidthRatio) {
      this.lastDispatchedEventValue.viewportWidthRatio = currentViewportWidthRatio;
      this.root.dispatchEvent(new CustomEvent("TOMEditor-changetextareaviewportwidthratio", {
        detail: {
          viewportWidthRatio: this.lastDispatchedEventValue.viewportWidthRatio
        } as TOMEditorChangeTextAreaViewportWidthRatio
      }));
    }
    const currentScrollLeft = this.textArea.scrollLeft;
    if (currentScrollLeft !== this.lastDispatchedEventValue.scrollLeft) {
      this.lastDispatchedEventValue.scrollLeft = currentScrollLeft;
      this.root.dispatchEvent(new CustomEvent("TOMEditor-changetextareascrollleft", {
        detail: {
          scrollLeft: this.lastDispatchedEventValue.scrollLeft
        } as TOMEditorChangeTextAreaScrollLeft
      }));
    }

    // その他の値は順番を気にせず呼びだします。
    const currentHeight = this.textArea.clientHeight;
    if (currentHeight !== this.lastDispatchedEventValue.height) {
      this.lastDispatchedEventValue.height = currentHeight;
      this.root.dispatchEvent(new CustomEvent("TOMEditor-resizetextareaheight", {
        detail: {
          height: this.lastDispatchedEventValue.height
        } as TOMEditorResizeTextAreaHeight
      }));
    }
    const currentWidth = this.textArea.clientWidth;
    if (currentWidth !== this.lastDispatchedEventValue.width) {
      this.lastDispatchedEventValue.width = currentWidth;
      this.root.dispatchEvent(new CustomEvent("TOMEditor-resizetextareawidth", {
        detail: {
          width: this.lastDispatchedEventValue.width
        } as TOMEditorResizeTextAreaWidth
      }));
    }
    const currentSelectingRange = Boolean(this.selectionRange.length);
    if (currentSelectingRange !== this.lastDispatchedEventValue.selectingRange) {
      this.lastDispatchedEventValue.selectingRange = currentSelectingRange;
      this.root.dispatchEvent(new CustomEvent("TOMEditor-changeselectingrange", {
        detail: {
          selectingRange: this.lastDispatchedEventValue.selectingRange
        } as TOMEditorChangeSelectiingRange
      }));
    }
  };

  /**
   * フォーカスされている文字を返します。
   */
  getFocusedCharacter = (): HTMLSpanElement => {
    if (this.focusPointIndex.row === null || this.focusPointIndex.column === null) {
      throw new Error("TextArea.prototype.getFocusedCharacter: フォーカスされていません。");
    }
    return this.textAreaContentList[this.focusPointIndex.row].characterList[this.focusPointIndex.column];
  };

  /**
   * 任意の編集履歴を文字領域に反映します。
   * @param {number} index 反映させたい編集履歴を指すインデックスです。
   */
  loadHistory = (index: number): void => {
    if (typeof this.history.data[index] === "undefined") {
      return;
    }

    // 指定された編集履歴に保存された文字領域の状態をWebページに反映します。
    this.textLinesWrapper.innerHTML = "";
    for (let i = 0; i < this.history.data[index].textAreaContentList.length; i += 1) {
      const textLine = this.history.data[index].textAreaContentList[i].textLine;
      textLine.textContent = "";
      for (const character of this.history.data[index].textAreaContentList[i].characterList) {
        textLine.appendChild(character);
      }
      this.textLinesWrapper.appendChild(textLine);
    }
    this.textArea.scrollLeft = this.history.data[index].scrollLeft;
    this.textArea.scrollTop = this.history.data[index].scrollTop;

    // プロパティの値にも反映させます。
    this.focusPointIndex = this.history.data[index].focusPointIndex;
    this.textAreaContentList = this.history.data[index].textAreaContentList.map((textAreaContent): TextAreaContent => {
      return {
        characterList: Array.from(textAreaContent.characterList),
        textLine: textAreaContent.textLine
      };
    });
  };

  /**
   * ドラッグ操作（エディター本体でのmousemoveイベント）の対象となったHTML要素に応じて、
   * フォーカス位置を更新するとともに選択範囲を更新します。
   * @param {HTMLElement}} target イベントの対象となったHTML要素です。
   * @returns {boolean} 対象となるHTML要素が処理の対象だった場合はtrueを返します。
   */
  moveFocusPointByDragTarget = (target: HTMLElement): boolean => {

    // まずは対象となるHTML要素からフォーカス位置を求めます。
    const focusPointTargetIndex: FocusPointIndex = {
      column: null,
      row: null
    };
    if (target.classList.contains(this.styleClass.textLine.element)) {

      // 行がクリックされたときは当該行の行末文字をフォーカス位置とします。
      focusPointTargetIndex.row = this.textAreaContentList.findIndex((textAreaContent): boolean => {
        return textAreaContent.textLine === target;
      });
      focusPointTargetIndex.column = this.textAreaContentList[focusPointTargetIndex.row].characterList.length - 1;
    } else if (target.classList.contains(this.styleClass.character.element)) {

      // 文字がクリックされたときは当該文字をフォーカス位置とします。
      focusPointTargetIndex.row = this.textAreaContentList.findIndex((textAreaContent): boolean => {
        if (target === null) {
          throw new Error("TextArea.prototype.moveFocusPointByDragTarget: targetがnullです。");
        }
        if (!(target instanceof Node)) {
          throw new Error("TextArea.prototype.moveFocusPointByDragTarget: mousedownイベントの発生対象がHTML要素ではありません。");
        }
        if (target.parentElement === null) {
          throw new Error();
        }
        return textAreaContent.textLine === target.parentElement;
      });
      focusPointTargetIndex.column = this.textAreaContentList[focusPointTargetIndex.row].characterList.findIndex((character): boolean => {
        return character === target;
      });
    } else {

      // クリックされたのが行でも文字でもない場合は処理から抜けます。
      return false;
    }

    // ドラッグされたHTML要素が現在フォーカス中のHTML要素と同じならば処理する必要が無いので抜けます。
    if (focusPointTargetIndex.row === this.focusPointIndex.row && focusPointTargetIndex.column === this.focusPointIndex.column) {
      return false;
    }

    // ドラッグ操作対象が行か文字だったということで、フォーカス位置と選択範囲の更新処理を行います。
    if (this.focusPointIndex.row === null || this.focusPointIndex.column === null) {
      throw new Error("TextArea.prototype.moveFocusPointByKey: フォーカスされていません。");
    }
    const differenceRow = Math.abs(focusPointTargetIndex.row - this.focusPointIndex.row);
    if (focusPointTargetIndex.row < this.focusPointIndex.row) {
      for (let i = 0; i < differenceRow; i += 1) {
        this.moveFocusPointByKey("ArrowUp", true);
      }
    } else if (focusPointTargetIndex.row > this.focusPointIndex.row) {
      for (let i = 0; i < differenceRow; i += 1) {
        this.moveFocusPointByKey("ArrowDown", true);
      }
    }
    const differenceColumn = Math.abs(focusPointTargetIndex.column - this.focusPointIndex.column);
    if (focusPointTargetIndex.column < this.focusPointIndex.column) {
      for (let i = 0; i < differenceColumn; i += 1) {
        this.moveFocusPointByKey("ArrowLeft", true);
      }
    } else if (focusPointTargetIndex.column > this.focusPointIndex.column) {
      for (let i = 0; i < differenceColumn; i += 1) {
        this.moveFocusPointByKey("ArrowRight", true);
      }
    }

    return true;
  };

  /**
   * 矢印キーと移動キーによるフォーカス位置と選択範囲の更新処理です。
   * @param {"ArrowDown" | "ArrowLeft" | "ArrowRight" | "ArrowUp" | "End" | "Home"} key 押されたキーです。
   * @param {boolean} shiftKey Shiftキーが押されているときはtrueになります。
   */
  moveFocusPointByKey = (key: "ArrowDown" | "ArrowLeft" | "ArrowRight" | "ArrowUp" | "End" | "Home", shiftKey: boolean): void => {
    if (this.focusPointIndex.row === null || this.focusPointIndex.column === null) {
      throw new Error("TextArea.prototype.moveFocusPointByKey: フォーカスされていません。");
    }

    // 下矢印キーを押されたときの処理です。
    if (key === "ArrowDown") {
      const goalRowIndex = this.focusPointIndex.row + 1;
      const goalColumnIndex = this.focusPointIndex.column;
      while (
        !(this.focusPointIndex.row === goalRowIndex && this.focusPointIndex.column === goalColumnIndex) &&
        !(this.focusPointIndex.row === goalRowIndex && this.focusPointIndex.column < goalColumnIndex) &&
        !(this.focusPointIndex.row === this.textAreaContentList.length - 1 && this.focusPointIndex.column === this.textAreaContentList[this.focusPointIndex.row].characterList.length - 1)
      ) {
        this.moveFocusPointByKey("ArrowRight", shiftKey);
      }
      return;
    }

    // 左矢印キーを押されたときの処理です。
    if (key === "ArrowLeft") {

      // 文頭か行頭のいるときの処理です。
      if (this.focusPointIndex.column === 0) {

        // 文頭にいるときは何もできないので処理から抜けます。
        if (this.focusPointIndex.row === 0) {
          return;
        }

        // 行頭にいるときは前の行の行末文字に移動します。
        this.focusPointIndex.row -= 1;
        this.focusPointIndex.column = this.textAreaContentList[this.focusPointIndex.row].characterList.length - 1;

        if (!shiftKey) {
          return;
        }

        // 新しく範囲選択を始めるときの処理です。
        if (!this.selectionRange.length) {
          this.getFocusedCharacter().classList.add(this.styleClass.character.modifier.select);
          this.selectionRange.push([this.getFocusedCharacter()]);
          return;
        }

        // 選択範囲が拡大されるときの処理です。
        if (!this.getFocusedCharacter().classList.contains(this.styleClass.character.modifier.select)) {
          this.getFocusedCharacter().classList.add(this.styleClass.character.modifier.select);
          this.selectionRange.unshift([this.getFocusedCharacter()]);
          return;
        }

        // 選択範囲が縮小されるときの処理です。
        this.getFocusedCharacter().classList.remove(this.styleClass.character.modifier.select);
        this.selectionRange.pop();
        if (!this.selectionRange.length) {
          this.selectionRange = [];
        }
        return;
      }

      // 文中にいるときは1つ前の文字に移動します。
      this.focusPointIndex.column -= 1;

      if (!shiftKey) {
        return;
      }

      // 新しく範囲選択を始めるときの処理です。
      if (!this.selectionRange.length) {
        this.getFocusedCharacter().classList.add(this.styleClass.character.modifier.select);
        this.selectionRange.push([this.getFocusedCharacter()]);
        return;
      }

      // 選択範囲が拡大されるときの処理です。
      if (!this.getFocusedCharacter().classList.contains(this.styleClass.character.modifier.select)) {
        this.getFocusedCharacter().classList.add(this.styleClass.character.modifier.select);
        this.selectionRange[0].unshift(this.getFocusedCharacter());
        return;
      }

      // 選択範囲が縮小されるときの処理です。
      this.getFocusedCharacter().classList.remove(this.styleClass.character.modifier.select);
      this.selectionRange[this.selectionRange.length - 1].pop();
      if (!this.selectionRange[0].length && this.selectionRange.length === 1) {
        this.selectionRange = [];
      }
      return;
    }

    // 右矢印キーが押されたときの処理です。
    if (key === "ArrowRight") {

      // 文末か行末にいるときの処理です。
      if (this.focusPointIndex.column === this.textAreaContentList[this.focusPointIndex.row].characterList.length - 1) {

        // 文末にいるときは何もできないので処理から抜けます。
        if (this.focusPointIndex.row === this.textAreaContentList.length - 1) {
          return;
        }

        // 行末にいるときは次の行の先頭に移動します。
        this.focusPointIndex.row += 1;
        this.focusPointIndex.column = 0;

        if (!shiftKey) {
          return;
        }
        const previousFocusedCharacter = this.textAreaContentList[this.focusPointIndex.row - 1].characterList[this.textAreaContentList[this.focusPointIndex.row - 1].characterList.length - 1];

        // 新しく範囲選択を始めるときの処理です。
        if (!this.selectionRange.length) {
          previousFocusedCharacter.classList.add(this.styleClass.character.modifier.select);
          this.selectionRange.push([previousFocusedCharacter]);
          return;
        }

        // 選択範囲が拡大されるときの処理です。
        if (!previousFocusedCharacter.classList.contains(this.styleClass.character.modifier.select)) {
          previousFocusedCharacter.classList.add(this.styleClass.character.modifier.select);
          this.selectionRange[this.selectionRange.length - 1].push(previousFocusedCharacter);
          this.selectionRange.push([]);
          return;
        }

        // 選択範囲が縮小されるときの処理です。
        previousFocusedCharacter.classList.remove(this.styleClass.character.modifier.select);
        this.selectionRange.shift();
        if (!this.selectionRange.length) {
          this.selectionRange = [];
        }
        return;
      }

      // 文中にいるときは1つ次の文字に移動します。
      this.focusPointIndex.column += 1;

      if (!shiftKey) {
        return;
      }
      const previousFocusedCharacter = this.textAreaContentList[this.focusPointIndex.row].characterList[this.focusPointIndex.column - 1];

      // 新しく範囲選択を始めるときの処理です。
      if (!this.selectionRange.length) {
        previousFocusedCharacter.classList.add(this.styleClass.character.modifier.select);
        this.selectionRange.push([previousFocusedCharacter]);
        return;
      }

      // 選択範囲が拡大されるときの処理です。
      if (!previousFocusedCharacter.classList.contains(this.styleClass.character.modifier.select)) {
        previousFocusedCharacter.classList.add(this.styleClass.character.modifier.select);
        this.selectionRange[this.selectionRange.length - 1].push(previousFocusedCharacter);
        return;
      }

      // 選択範囲が縮小されるときの処理です。
      previousFocusedCharacter.classList.remove(this.styleClass.character.modifier.select);
      this.selectionRange[0].shift();
      if (!this.selectionRange[0].length) {
        this.selectionRange = [];
      }
      return;
    }

    // 上矢印キーが押されたときの処理です。
    if (key === "ArrowUp") {
      const goalRowIndex = this.focusPointIndex.row - 1;
      const goalColumnIndex = this.focusPointIndex.column;
      while (
        !(this.focusPointIndex.row === goalRowIndex && this.focusPointIndex.column === goalColumnIndex) &&
        !(this.focusPointIndex.row === goalRowIndex && this.focusPointIndex.column < goalColumnIndex) &&
        !(this.focusPointIndex.row === 0 && this.focusPointIndex.column === 0)
      ) {
        this.moveFocusPointByKey("ArrowLeft", shiftKey);
      }
      return;
    }

    // Endキーが押されたときの処理です。
    if (key === "End") {
      for (let i = 0; i < this.textAreaContentList[this.focusPointIndex.row].characterList.length - 1 - this.focusPointIndex.column; i += 1) {
        this.moveFocusPointByKey("ArrowDown", shiftKey);
      }
      return;
    }

    // Homeキーが押されたときの処理です。
    if (key === "Home") {
      for (let i = 0; i < this.focusPointIndex.column; i += 1) {
        this.moveFocusPointByKey("ArrowUp", shiftKey);
      }
      return;
    }

    throw new Error(`TextArea.prototype.moveFocusPointByKey: 想定外の引数です（${key}）。`);
  };

  /**
   * mousedownイベントが発生したHTML要素に応じてフォーカス位置を変更します。
   * @param {MouseEvent} event mousedownイベントの通知オブジェクトです。
   */
  moveFocusPointByMousedownTarget = (event: MouseEvent): void => {
    if (event.target === null) {
      throw new Error("TextArea.prototype.moveFocusPointByMousedownTarget: MouseEvent.targetがnullです。");
    }
    if (!(event.target instanceof HTMLElement)) {
      throw new Error("TextArea.prototype.moveFocusPointByMousedownTarget: mousedownイベントの発生対象がHTML要素ではありません。");
    }

    // 行がクリックされたときは当該行の行末文字をフォーカス位置とします。
    if (event.target.classList.contains(this.styleClass.textLine.element)) {
      this.focusPointIndex.row = this.textAreaContentList.findIndex((textAreaContent): boolean => {
        return textAreaContent.textLine === event.target;
      });
      this.focusPointIndex.column = this.textAreaContentList[this.focusPointIndex.row].characterList.length - 1;
      return;
    }

    // 文字がクリックされたときは当該文字をフォーカス位置とします。
    if (event.target.classList.contains(this.styleClass.character.element)) {
      this.focusPointIndex.row = this.textAreaContentList.findIndex((textAreaContent): boolean => {
        if (event.target === null) {
          throw new Error("TextArea.prototype.moveFocusPointByMousedownTarget: MouseEvent.targetがnullです。");
        }
        if (!(event.target instanceof Node)) {
          throw new Error("TextArea.prototype.moveFocusPointByMousedownTarget: mousedownイベントの発生対象がHTML要素ではありません。");
        }
        if (event.target.parentElement === null) {
          throw new Error();
        }
        return textAreaContent.textLine === event.target.parentElement;
      });
      this.focusPointIndex.column = this.textAreaContentList[this.focusPointIndex.row].characterList.findIndex((character): boolean => {
        return character === event.target;
      });
    }
  };

  /**
   * キャレット上で押されたキーに応じた処理を実行します。
   * 一部のキー処理で非同期のClipboard APIを利用しているため、
   * その他同期的なキー入力処理と同じ使い勝手になるように全体をPromiseで囲って非同期処理化しています。
   * @param {string} key 入力されたキー情報です。
   * @param {boolean} shiftKey Shiftキーが押されているときはtrueが入ります。
   * @param {boolean} ctrlKey Ctrlキーがおされているときはtrueが入ります。
   * @returns {Promise} 押されたキーが有効だった場合はtrueを返します。
   */
  reflectKey = (key: string, shiftKey: boolean, ctrlKey: boolean): Promise<boolean> => {
    return new Promise(async (resolve): Promise<void> => {
      if (this.focusPointIndex.row === null || this.focusPointIndex.column === null) {
        throw new Error("TextArea.prototype.reflectKey: フォーカスされていません。");
      }

      // Ctrlキーが押されている間はショートカット処理とその判定のみを行います。
      if (ctrlKey) {

        // Ctrl + aで全文を選択します。
        // フォーカス位置は文末になります。
        if (key === "a") {
          this.selectionRange = this.textAreaContentList.map((textAreaContent) => {
            return Array.from(textAreaContent.characterList);
          });
          this.selectionRange[this.selectionRange.length - 1].pop();
          for (const characters of this.selectionRange) {
            for (const character of characters) {
              character.classList.add(this.styleClass.character.modifier.select);
            }
          }
          this.focusPointIndex.row = this.textAreaContentList.length - 1;
          this.focusPointIndex.column = this.textAreaContentList[this.focusPointIndex.row].characterList.length - 1;
          return resolve(true);
        }

        // Ctrl + cで範囲選択中の文字をクリップボードにコピーします。
        if (key === "c") {
          const convertedText = this.convertSelectedRangeIntoText(false);
          await navigator.clipboard.writeText(convertedText);
          return resolve(true);
        }

        // Ctrl + vでクリップボードの文字を文字領域にペーストします。
        if (key === "v") {

          // Firefoxではnavigator.clipboard.readTextメソッドはブラウザの拡張機能でのみ機能します。
          if (!navigator.clipboard.readText) {
            alert("【！ 申し訳ございません ！】\nお使いのブラウザはペースト機能が非対応となっているようです。\nペースト機能をご利用いただく場合は別のブラウザでお願いします。");
            return resolve(false);
          }

          await navigator.clipboard.readText().then((textInClipboard) => {
            if (this.focusPointIndex.row === null || this.focusPointIndex.column === null) {
              throw new Error("TextArea.prototype.reflectKey: フォーカスされていません。");
            }
            if (this.selectionRange.length) {
              this.removeCharactersInSelectionRange();
            }
            for (const character of textInClipboard.replace(/\r\n/g, "\n")) {
              if (character === "\n") {
                const deleteCount = this.textAreaContentList[this.focusPointIndex.row].characterList.length - 1 - this.focusPointIndex.column;
                this.appendTextLine(this.textAreaContentList[this.focusPointIndex.row].characterList.splice(this.focusPointIndex.column, deleteCount));
                continue;
              }
              this.appendCharacter(character);
            }
          });
          return resolve(true);
        }

        // Ctrl + xで選択範囲中の文字をカットします。
        if (key === "x") {
          const convertedText = this.convertSelectedRangeIntoText(true);
          await navigator.clipboard.writeText(convertedText);
          return resolve(true);
        }

        // Ctrl + yで1つ後の編集状態に移動します。
        if (key === "y") {
          if (!this.history.data[this.history.index + 1]) {
            return resolve(false);
          }
          this.history.index += 1;
          this.loadHistory(this.history.index);
          return resolve(true);
        }

        // Ctrl + zで1つ前の編集状態に移動します。
        if (key === "z") {
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
      if (key.length === 1) {
        if (this.selectionRange.length) {
          this.removeCharactersInSelectionRange();
        }
        this.appendCharacter(key);
        return resolve(true);
      }

      // 矢印キーと移動キーによるフォーカス位置の変更と範囲選択の更新処理です。
      // 範囲選択がされている状態でShiftキーを押さずに矢印キーが押された場合は、選択範囲の解除だけを行います。
      if (key.includes("Arrow") || ["End", "Home"].includes(key)) {
        if (!shiftKey && this.selectionRange.length) {
          this.unselctRange();
        } else {
          this.moveFocusPointByKey(key as "ArrowDown" | "ArrowLeft" | "ArrowRight" | "ArrowUp" | "End" | "Home", shiftKey);
        }
        return resolve(true);
      }

      // BackspaceキーとDeleteキーによる、文字あるいは選択範囲の削除処理です。
      // 範囲選択がされているならばShiftキーが押されているかどうかを問わず、選択範囲を削除します。
      if (["Backspace", "Delete"].includes(key)) {
        if (this.selectionRange.length) {
          this.removeCharactersInSelectionRange();
        } else {
          this.removeCharacter(key as "Backspace" | "Delete");
        }
        return resolve(true);
      }

      // その他キー入力です。
      if (key === "Enter") {
        if (!shiftKey && this.selectionRange.length) {
          this.removeCharactersInSelectionRange();
        }
        const deleteCount = this.textAreaContentList[this.focusPointIndex.row].characterList.length - 1 - this.focusPointIndex.column;
        this.appendTextLine(this.textAreaContentList[this.focusPointIndex.row].characterList.splice(this.focusPointIndex.column, deleteCount));
        return resolve(true);
      }
      if (key === "Tab") {
        if (shiftKey) {
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
  removeCharacter = (key: "Backspace" | "Delete"): void => {
    if (this.focusPointIndex.row === null || this.focusPointIndex.column === null) {
      throw new Error("TextArea.prototype.removeCharacter: フォーカスされていません。");
    }

    // Backspaceキーが押されたときの処理です。
    if (key === "Backspace") {
      if (this.focusPointIndex.column === 0) {
        if (this.focusPointIndex.row === 0) {
          return;
        }
        this.focusPointIndex.row -= 1;
        this.focusPointIndex.column = this.textAreaContentList[this.focusPointIndex.row].characterList.length - 1;
        this.removeTextLine();
        return;
      }
      this.focusPointIndex.column -= 1;
      this.textAreaContentList[this.focusPointIndex.row].characterList.splice(this.focusPointIndex.column, 1)[0].remove();
      return;
    }

    // Deleteキーが押されたときの処理です。
    if (key === "Delete") {
      if (this.focusPointIndex.column === this.textAreaContentList[this.focusPointIndex.row].characterList.length - 1) {
        if (this.focusPointIndex.row === this.textAreaContentList.length - 1) {
          return;
        }
        this.removeTextLine();
        return;
      }
      this.textAreaContentList[this.focusPointIndex.row].characterList.splice(this.focusPointIndex.column, 1)[0].remove();
      return;
    }

    throw new Error(`TextArea.prototype.removeCharacter: 想定外の引数です（${key}）。`);
  };

  /**
   * 範囲選択された文字を全て削除します。
   */
  removeCharactersInSelectionRange = (): void => {
    let numberOfCharacters = 0;
    for (const row of this.selectionRange) {
      numberOfCharacters += row.length;
    }
    if (this.getFocusedCharacter().classList.contains(this.styleClass.character.modifier.select)) {
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
  removeTextLine = (): void => {
    if (this.focusPointIndex.row === null || this.focusPointIndex.column === null) {
      throw new Error("TextArea.prototype.removeCharacter: フォーカスされていません。");
    }

    // 文字を移動します。
    const movingCharacterList = this.textAreaContentList[this.focusPointIndex.row + 1].characterList.splice(0);
    for (const character of movingCharacterList.reverse()) {
      this.textAreaContentList[this.focusPointIndex.row].characterList.splice(this.focusPointIndex.column + 1, 0, character);
      this.getFocusedCharacter().after(character);
    }

    // 文字が全て抽出されて不要になった行を削除します。
    this.textAreaContentList.splice(this.focusPointIndex.row + 1, 1)[0].textLine.remove();

    // このままだと1つの行に2つのEOLが混在するので元々入っていたほうのEOLを削除します。
    this.textAreaContentList[this.focusPointIndex.row].characterList.splice(this.focusPointIndex.column, 1)[0].remove();
  };

  /**
   * 編集履歴に新たな状態を保存します。
   */
  saveHistory = (): void => {

    // 初めて実行するときの処理です。
    if (typeof this.history === "undefined") {
      this.history = {
        data: [{
          focusPointIndex: {
            column: 0,
            row: 0
          },
          scrollLeft: 0,
          scrollTop: 0,
          textAreaContentList: [{
            characterList: Array.from(this.textAreaContentList[0].characterList),
            textLine: this.textAreaContentList[0].textLine
          }]
        }],
        index: 0
      };
      return;
    }

    // 現在の文字領域の状態・値が編集履歴の最新となるように保存（参照渡しではなく値渡しになるように注意すること）します。
    // このときRedo中ならばRedoされている履歴は削除します。
    this.history.data.splice(this.history.index + 1);
    const currentHistory = {
      focusPointIndex: {
        column: this.focusPointIndex.column,
        row: this.focusPointIndex.row
      },
      scrollLeft: this.textArea.scrollLeft,
      scrollTop: this.textArea.scrollTop,
      textAreaContentList: [] as TextAreaContent[]
    };
    for (const textAreaContent of this.textAreaContentList) {
      currentHistory.textAreaContentList.push({
        characterList: Array.from(textAreaContent.characterList),
        textLine: textAreaContent.textLine
      });
    }
    this.history.data.push(currentHistory);
    this.history.index += 1;
  };

  /**
   * 自動スクロールを処理を行うべきかを判定し、必要ならば自動スクロールを行います。
   */
  scrollAutomatically = (): void => {

    // 自動スクロールはフォーカス位置が文字領域外に出たときには必ず実行されます。
    // ただ、それだと当該文字が文字領域縁ギリギリのところに置かれつづけるために視認性が悪いという問題が残ります、
    // そこで、いくらか内側にも処理の対象範囲を広げています。
    // 以下4つの変数は上下左右の対象範囲を何文字分広げるかという値です。
    const innerRangeTop = 0.5;
    const innerRangeBottom = 1.5;
    const innerRangeLeft = 1.5;
    const innerRangeRight = 2.5;

    const focusedCharacterDOMRect = this.getFocusedCharacter().getBoundingClientRect();
    const textAreaRect = this.textArea.getBoundingClientRect();
    if (focusedCharacterDOMRect.top < textAreaRect.top + focusedCharacterDOMRect.height * innerRangeTop) {
      this.textArea.scrollTop -= (textAreaRect.top + focusedCharacterDOMRect.height * innerRangeTop) - focusedCharacterDOMRect.top;
    } else if (focusedCharacterDOMRect.bottom > textAreaRect.bottom - focusedCharacterDOMRect.height * innerRangeBottom) {
      this.textArea.scrollTop += focusedCharacterDOMRect.bottom - (textAreaRect.bottom - focusedCharacterDOMRect.height * innerRangeBottom);
    }
    if (focusedCharacterDOMRect.left < textAreaRect.left + focusedCharacterDOMRect.width * innerRangeLeft) {
      this.textArea.scrollLeft -= (textAreaRect.left + focusedCharacterDOMRect.width * innerRangeLeft) - focusedCharacterDOMRect.left;
    } else if (focusedCharacterDOMRect.right > textAreaRect.right - focusedCharacterDOMRect.width * innerRangeRight) {
      this.textArea.scrollLeft += focusedCharacterDOMRect.right - (textAreaRect.right - focusedCharacterDOMRect.width * innerRangeRight);
    }
  };

  /**
   * 選択範囲を解除します。
   */
  unselctRange = (): void => {
    for (const characterList of this.selectionRange) {
      for (const character of characterList) {
        character.classList.remove(this.styleClass.character.modifier.select);
      }
    }
    this.selectionRange = [];
  };
};

export {
  TextArea
}
