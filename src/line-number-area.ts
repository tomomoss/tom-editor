/**
 * 行番号領域を制御します。
 * @param {Main} root ライブラリのエントリポイントです。
 * @param {boolean} readonlyFlag 読みとり専用状態ならばtrueが入ります。
 */
const LineNumberArea = class {
  constructor(root: Main, readonlyFlag: boolean) {
    this.root = root;
    this.readonlyFlag = readonlyFlag;
    this.focusedLineNumberIndex = null;
    this.lastDraggedIndex = null;
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
    this.definePublishingEventListeners();
    this.defineSubscribingEventListeners();
  }

  /** @type {number | null} フォーカスされている行を指すインデックス値です。 */
  focusedLineNumberIndex: number | null;

  /** @type {number | null} 最後にドラッグした行番号のインデックス値です。 */
  lastDraggedIndex: number | null;

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
   * 行番号のフォーカス状態を更新します。
   * @param {number | null} index フォーカスする行番号を指すインデックスです。
   */
  changeFocusedLineNumber = (index: number | null): void => {

    // 引数にnullが指定されている場合はフォーカスする行番号がないことを意味しますのでフォーカス状態を解除します。
    if (index === null) {
      if (this.focusedLineNumberIndex === null) {
        return;
      }
      if (typeof this.lineNumberList[this.focusedLineNumberIndex] !== "undefined") {
        this.lineNumberList[this.focusedLineNumberIndex].classList.remove(this.styleClass.lineNumber.modifier.focus);
      }
      this.focusedLineNumberIndex = null;
      return;
    }

    // 新たな行にフォーカスを移します。
    if (this.focusedLineNumberIndex !== null && typeof this.lineNumberList[this.focusedLineNumberIndex] !== "undefined") {
      this.lineNumberList[this.focusedLineNumberIndex].classList.remove(this.styleClass.lineNumber.modifier.focus);
    }
    this.focusedLineNumberIndex = index;
    this.lineNumberList[this.focusedLineNumberIndex].classList.add(this.styleClass.lineNumber.modifier.focus);
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
   * 出版用イベントリスナーを定義します。
   */
  definePublishingEventListeners = (): void => {

    // 読みとり専用状態にする場合は一部のイベントリスナーの定義を省略します。
    if (this.readonlyFlag) {
      return;
    }

    // 行番号がクリックされたときは、文字領域にクリックされた行番号を発信します。
    // また、ドラッグ操作処理開始の合図でもあります。
    this.lineNumberArea.addEventListener("mousedown", (event): void => {
      this.lastDraggedIndex = this.lineNumberList.findIndex((lineNumber): boolean => {
        return lineNumber === event.target;
      });
      this.root.dispatchEvent(new CustomEvent("TOMEditor-mousedownlinenumber", {
        detail: {
          lineNumberIndex: this.lastDraggedIndex
        } as TOMEditorMouseDownLineNumber
      }));
    });
  };

  /**
   * 購読用イベントリスナーを定義します。
   */
  defineSubscribingEventListeners = (): void => {

    // 文字領域に表示されている行数が増減したため、行番号領域の行数も合わせます。
    this.root.addEventListener("TOMEditor-changenumberoftextlines", (event: CustomEventInit<TOMEditorChangeNumberOfTextLinesEvent>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("LineNumberArea.prototype.defineSubscribingEventListeners: TOMEditor-changenumberoftextlinesイベントのdetailプロパティが空です。");
      }
      const processingTime = Math.abs(event.detail.numberOfTextLines - this.lineNumberList.length);
      if (event.detail.numberOfTextLines > this.lineNumberList.length) {
        for (let i = 0; i < processingTime; i += 1) {
          this.appendLineNumber();
        }
        return;
      }
      if (event.detail.numberOfTextLines < this.lineNumberList.length) {
        for (let i = 0; i < processingTime; i += 1) {
          this.removeLineNumber();
        }
        return;
      }
    });

    // 文字領域の垂直方向のスクロール量が変化したため、行番号領域も合わせます。
    this.root.addEventListener("TOMEditor-changetextareascrolltop", (event: CustomEventInit<TOMEditorChangeTextAreaScrollTop>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("LineNumberArea.prototype.defineSubscribingEventListeners: TOMEditor-changetextareascrolltopイベントのdetailプロパティが空です。");
      }
      this.lineNumberArea.scrollTop = event.detail.scrollTop;
    });

    // 第1次初期化処理を実行します。
    this.root.addEventListener("TOMEditor-firstinitialize", (event: CustomEventInit<TOMEditorFirstInitializeEvent>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("LineNumberArea.prototype.defineSubscribingEventListeners: TOMEditor-initializeイベントのdetailプロパティが空です。");
      }
      event.detail.editor.appendChild(this.lineNumberArea);
    });

    // 読みとり専用状態にする場合は一部のイベントリスナーの定義を省略します。
    if (this.readonlyFlag) {
      return;
    }

    // フォーカスしている行が変更されたため、行番号領域のフォーカス行番号も変更します。
    this.root.addEventListener("TOMEditor-changefocusedrowindex", (event: CustomEventInit<TOMEditorChangeFocusedRowIndexEvent>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("LineNumberArea.prototype.defineSubscribingEventListeners: TOMEditor-changefocusedrowindexイベントのdetailプロパティが空です。");
      }
      this.changeFocusedLineNumber(event.detail.focusedRowIndex);
    });

    // ドラッグ操作処理フラグが立っているときは、行番号を対象とするドラッグ操作処理を実行します。
    this.root.addEventListener("TOMEditor-mousemove", (event: CustomEventInit<TOMEditorMouseMoveEvent>): void => {
      if (this.lastDraggedIndex === null) {
        return;
      }
      const currentDragedIndex = this.lineNumberList.findIndex((lineNumber): boolean => {
        if (typeof event.detail === "undefined") {
          throw new Error("LineNumberArea.prototype.defineSubscribingEventListeners: TOMEditor-mousemoveイベントのdetailプロパティが空です。");
        }
        return lineNumber === event.detail.target;
      });
      if (currentDragedIndex === this.lastDraggedIndex) {
        return;
      }
      this.lastDraggedIndex = currentDragedIndex;
      this.root.dispatchEvent(new CustomEvent("TOMEditor-draglinenumber", {
        detail: {
          draggedIndex: this.lastDraggedIndex
        } as TOMEditorDragLineNumberEvent
      }));
    });

    // ドラッグ処理フラグを下ろします。
    this.root.addEventListener("TOMEditor-mouseup", (): void => {
      this.lastDraggedIndex = null;
    });
  };

  /**
   * 行番号を1つ減らします。
   */
  removeLineNumber = (): void => {
    const lineNumber = this.lineNumberList.pop();
    if (typeof lineNumber === "undefined") {
      throw new Error("LineNumberArea.prototype.removeLineNumber: 全ての行番号が取り除かれました。");
    }
    lineNumber.remove();
  };
};

export {
  LineNumberArea
}
