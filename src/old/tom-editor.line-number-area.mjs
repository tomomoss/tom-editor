"use strict";

/**
 * 行番号領域です。
 * @param {HTMLDivElement} editor エディター本体です。
 * @param {boolean} readonlyFlag 読みとり専用状態にするならばtrueが入っています。
 */
const LineNumberArea = class {
  constructor(editor, readonlyFlag) {
    Object.seal(this);
    this.editor = editor;
    this.lineNumberArea = this.createLineNumberArea(readonlyFlag);
    this.editor.appendChild(this.lineNumberArea);
    this.appendLineNumber();
    this.setEventListeners(readonlyFlag);
  }

  /** @type {object} 当クラス内で使用するCSSクラスです。 */
  CSSClass = {
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

  /** @type {HTMLDivElement} エディター本体です。 */
  editor;

  /** @type {null|number} フォーカスしている行番号を指すインデックスです。 */
  focusedLineNumberIndex = null;

  /** @type {HTMLDivElement} 行番号領域です */
  lineNumberArea;

  /** @type {Array<HTMLDivElement>} 現在Webページに挿入されている行番号です。 */
  lineNumbers = [];

  /**
   * 行番号を1つ追加します。
   */
  appendLineNumber = () => {
    const lineNumber = this.createLineNumber();
    this.lineNumbers.push(lineNumber);
    this.lineNumberArea.appendChild(lineNumber);
  };

  /**
   * 行番号のフォーカス状態を更新します。
   * @param {null|number} index フォーカスする行番号を指すインデックスです。
   */
  changeFocusLineNumber = (index) => {

    // 引数にnullが指定されているということはフォーカスする行番号がないということなので、フォーカス状態を解除します。
    if (index === null) {
      if (this.focusedLineNumberIndex === null) {
        return;
      }
      if (this.lineNumbers[this.focusedLineNumberIndex].classList.contains(this.CSSClass.lineNumber.modifier.focus)) {
        this.lineNumbers[this.focusedLineNumberIndex].classList.remove(this.CSSClass.lineNumber.modifier.focus);
      }
      this.focusedLineNumberIndex = null;
      return;
    }

    // 引数で指定された行番号とフォーカスしている行番号が同じ場合は、何もすることがないので処理から抜けます。
    if (index === this.focusedLineNumberIndex) {
      return;
    }


    if (this.focusedLineNumberIndex !== null && this.lineNumbers[this.focusedLineNumberIndex]) {
      this.lineNumbers[this.focusedLineNumberIndex].classList.remove(this.CSSClass.lineNumber.modifier.focus);
    }
    this.focusedLineNumberIndex = index;
    this.lineNumbers[this.focusedLineNumberIndex].classList.add(this.CSSClass.lineNumber.modifier.focus);
  };

  /**
   * 行番号を生成します。
   * @returns {HTMLDivElement} 行番号です。
   */
  createLineNumber = () => {
    const lineNumber = document.createElement("div");
    lineNumber.classList.add(this.CSSClass.lineNumber.element);
    if (this.lineNumberArea.classList.contains(this.CSSClass.lineNumberArea.modifier.readOnly)) {
      lineNumber.classList.add(this.CSSClass.lineNumber.modifier.readOnly);
    }
    lineNumber.textContent = this.lineNumbers.length + 1;
    return lineNumber;
  };

  /**
   * 行番号領域を生成します。
   * @param {boolean} readonlyFlag 読みとり専用状態にするならばtrueが入っています。
   * @returns {HTMLDivElement} 行番号領域です。
   */
  createLineNumberArea = (readonlyFlag) => {
    const lineNumberArea = document.createElement("div");
    lineNumberArea.classList.add(this.CSSClass.lineNumberArea.element);
    if (readonlyFlag) {
      lineNumberArea.classList.add(this.CSSClass.lineNumberArea.modifier.readOnly);
    }
    return lineNumberArea;
  };

  /**
   * 行番号を1つ減らします。
   */
  removeLineNumber = () => {
    this.lineNumbers.pop().remove();
  };

  /**
   * イベントリスナーを実装します。
   * @param {boolean} readonlyFlag 読みとり専用状態にするならばtrueが入っています。
   */
  setEventListeners = (readonlyFlag) => {

    // 文字領域に表示されている行数が増減したため、行番号領域の行数も合わせます。
    this.editor.addEventListener("custom-changeNumberOfTextLines", (event) => {
      while (event.detail.length > this.lineNumbers.length) {
        this.appendLineNumber();
      }
      while (event.detail.length < this.lineNumbers.length) {
        this.removeLineNumber();
      }
    });

    // 文字領域の垂直方向のスクロール量が変化したため、行番号領域も合わせます。
    this.editor.addEventListener("custom-changeTextAreaScrollTop", (event) => {
      this.lineNumberArea.scrollTop = event.detail.scrollTop;
    });

    // 読みとり専用状態にする場合は一部のイベントリスナーを省略します。
    // 以下、読み取り専用状態時は省略する値やイベントリスナーです。
    if (!readonlyFlag) {

      // 行番号を対象とするドラッグ操作処理のフラグです。
      // 処理中は、最後にドラッグした行番号のインデックス値が入ります。
      let lastDragedIndex = null;

      // 行番号がクリックされたときは、文字領域にクリックされた行番号を通知します。
      // また、ドラッグフラグを立てます。
      this.lineNumberArea.addEventListener("mousedown", (event) => {
        lastDragedIndex = this.lineNumbers.findIndex((lineNumber) => {
          return lineNumber === event.target;
        });
        this.editor.dispatchEvent(new CustomEvent("custom-mousedonwLineNumber", {
          detail: {
            index: lastDragedIndex
          }
        }));
      });

      // フラグが立っているときは、行番号を対象とするドラッグ操作処理を実行します。
      this.editor.addEventListener("custom-mousemove", (event) => {
        if (lastDragedIndex === null) {
          return;
        }
        const currentDragedIndex = this.lineNumbers.findIndex((lineNumber) => {
          return lineNumber === event.detail.target;
        });
        if (currentDragedIndex === lastDragedIndex) {
          return;
        }
        lastDragedIndex = currentDragedIndex;
        this.editor.dispatchEvent(new CustomEvent("custom-dragLineNumber", {
          detail: {
            index: lastDragedIndex
          }
        }));
      });

      // ドラッグ処理フラグを下ろします。
      this.editor.addEventListener("custom-mouseup", () => {
        lastDragedIndex = null;
      });

      // 文字領域でフォーカスしている行が変更されたため、行番号領域のフォーカス行番号も変更します。
      this.editor.addEventListener("custom-changeFocusedRowIndex", (event) => {
        this.changeFocusLineNumber(event.detail.index);
      });
    }
  };
};

export {
  LineNumberArea
}
