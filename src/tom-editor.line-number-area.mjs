"use strict";

/**
 * 行番号領域です。
 */
const LineNumberArea = class {

  /**
   * 行番号領域を初期化します。
   * @param {HTMLDivElement} editor エディター本体です。
   */
  constructor(editor) {
    this.lineNumberArea = this.createLineNumberArea(editor);
    editor.appendChild(this.lineNumberArea);
    this.appendLineNumber();

    // 行番号領域の横幅を求めます。
    // 横幅は「半角英数字の横幅 * 表示する桁数 + 行番号のpadding-rightプロパティの値」とします。

    // 半角英数字の横幅を求めます。
    const temporaryElement = document.createElement("span");
    temporaryElement.innerHTML = "0";
    editor.appendChild(temporaryElement);
    const alphanumericWidth = temporaryElement.getBoundingClientRect().width;
    temporaryElement.remove();

    // 表示する桁数です。
    // 横幅は表示桁数分の横幅に0.5文字分の横幅を加えることで視覚的に少し余裕をもたせます。
    const maximumNumberOfDigits = 4.5;

    // 行番号のpadding-rightプロパティの値です。
    const lineNumberPaddingRight = parseFloat(getComputedStyle(this.lineNumbers[0]).paddingRight);

    this.lineNumberArea.style.flexBasis = `${alphanumericWidth * maximumNumberOfDigits + lineNumberPaddingRight}px`;
  }

  /** @type {number} フォーカスしている行番号を指すインデックスです。 */
  focusedLineNumberIndex = null;

  /** @type {null|number} ドラッグ処理で最後に参照した行のインデックス値が入ります。 */
  lastDragedIndex = null;

  /** @type {HTMLDivElement} 行番号領域です */
  lineNumberArea = null;

  /** @type {Array<HTMLDivElement>} 現在Webページに挿入されている行番号の数です。 */
  lineNumbers = [];

  /**
   * 行数を文字領域の行数に合わせます。
   * @param {number} textLinesLength 文字領域に入力されている行の数です。
   */
  adjustNumberOfLineNumbers = (textLinesLength) => {
    const lineDifference = textLinesLength - this.lineNumbers.length;
    if (Math.sign(lineDifference) === 1) {
      for (let i = 0; i < lineDifference; i += 1) {
        this.appendLineNumber();
      }
      return;
    }
    if (Math.sign(lineDifference) === -1) {
      for (let i = 0; i < Math.abs(lineDifference); i += 1) {
        this.removeLineNumber();
      }
      return;
    }
  };

  /**
   * 行番号を1つ追加します。
   */
  appendLineNumber = () => {
    const lineNumber = this.createLineNumber();
    this.lineNumbers.push(lineNumber);
    this.lineNumberArea.appendChild(lineNumber);
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
   * @returns {HTMLDivElement} 行番号領域です。
   */
  createLineNumberArea = () => {
    const lineNumberArea = document.createElement("div");
    lineNumberArea.classList.add("tom-editor__line-number-area");
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
   * @param {HTMLDivElement} textArea 文字領域です
   */
  setEventListeners = (textArea) => {

    // キャレットのフォーカスが外れたので、フォーカス状態を消去します。
    this.lineNumberArea.addEventListener("blurCaret", () => {
      this.updateFocusLineNumber(null);
    });

    // キャレットに入力されたキーによって文字領域の状態が変化したので、
    // 変化後のフォーカス状態にあわせて強調する行番号を更新します。
    this.lineNumberArea.addEventListener("keydownCaret-textArea", (event) => {
      this.adjustNumberOfLineNumbers(event.detail.length);
      this.updateFocusLineNumber(event.detail.index);
      this.lineNumberArea.scrollTop = event.detail.scrollTop;
    });

    // 行番号がクリックされたときは、文字領域にクリックされた行番号を通知します。
    // また、ドラッグフラグを起動します。
    this.lineNumberArea.addEventListener("mousedown", (event) => {
      this.lastDragedIndex = this.lineNumbers.findIndex((lineNumber) => {
        return lineNumber === event.target;
      });
      textArea.dispatchEvent(new CustomEvent("mousedownLineNumberArea", {
        detail: {
          index: this.lineNumbers.findIndex((lineNumber) => {
            return lineNumber === event.target;
          })
        }
      }));
    });

    // 行番号がクリックされて1行範囲選択処理が実行されたので、
    // 更新後のフォーカス状態にあわせて強調する行番号を更新します。
    this.lineNumberArea.addEventListener("mousedownLineNumberArea-textArea", (event) => {
      this.adjustNumberOfLineNumbers(event.detail.length);
      this.updateFocusLineNumber(event.detail.index);
      this.lineNumberArea.scrollTop = event.detail.scrollTop;
    });

    // 文字領域のどこかがクリックされてフォーカス位置が更新されたので、
    // 更新後のフォーカス状態にあわせて強調する行番号を更新します。
    this.lineNumberArea.addEventListener("mousedownTextArea", (event) => {
      this.adjustNumberOfLineNumbers(event.detail.length);
      this.updateFocusLineNumber(event.detail.index);
      this.lineNumberArea.scrollTop = event.detail.scrollTop;
    });

    // 垂直方向のスクロールバー領域の余白部分がクリックされましたので、
    // マウスホイール操作処理と同様に一定量のスクロールを実施します。
    this.lineNumberArea.addEventListener("mousedownVirticalScrollbarArea", (event) => {
      this.lineNumberArea.scrollTop += event.detail.scrollSize;
    });

    //
    this.lineNumberArea.addEventListener("mousemoveEditor", (event) => {
      if (this.lastDragedIndex === null || !event.detail.target.classList.contains("tom-editor__line-number-area__line-number")) {
        return;
      }
      const targetIndex = this.lineNumbers.findIndex((lineNumber) => {
        return lineNumber === event.detail.target;
      });
      if (targetIndex === this.lastDragedIndex) {
        return;
      }
      textArea.dispatchEvent(new CustomEvent("mousemoveEditor-lineNumberArea", {
        detail: {
          index: targetIndex
        }
      }));
    });

    //
    this.lineNumberArea.addEventListener("mousemoveEditor-lineNumberArea-textArea", (event) => {
      this.updateFocusLineNumber(event.detail.index);
      this.lineNumberArea.scrollTop = event.detail.scrollTop;
    });

    // 文字領域でドラッグ操作が実行されてフォーカス位置とスクロール量が更新されましたので、
    // こちらもフォーカスする行番号とスクロール量を更新します。
    this.lineNumberArea.addEventListener("mousemoveEditor-textArea", (event) => {
      this.updateFocusLineNumber(event.detail.index);
      this.lineNumberArea.scrollTop = event.detail.scrollTop;
    });

    // 垂直方向のスクロールバーがドラッグ移動されましたので、移動したぶんだけスクロールします。
    this.lineNumberArea.addEventListener("mousemoveEditor-virticalScrollbarArea", (event) => {
      this.lineNumberArea.scrollTop += this.lineNumberArea.scrollHeight * event.detail.scrollRatio;
    });

    //
    this.lineNumberArea.addEventListener("mouseupWindow", () => {
      this.lastDragedIndex = null;
    });

    // 行番号領域上でマウスホイールが操作されたのでスクロール処理を実行します。
    this.lineNumberArea.addEventListener("wheel", (event) => {
      const scrollSize = Math.sign(event.deltaY) * parseFloat(getComputedStyle(this.lineNumberArea).fontSize) * 3;
      this.lineNumberArea.scrollTop += scrollSize;
      textArea.dispatchEvent(new CustomEvent("wheelLineNumberArea", {
        detail: {
          scrollSize: scrollSize
        }
      }));
    });

    // 文字領域上でマウスホイールが回転されましたので、回転方向に合わせて行番号領域をスクロールします。
    this.lineNumberArea.addEventListener("wheelTextArea", (event) => {
      this.lineNumberArea.scrollTop = event.detail.scrollTop;
    });

    // 垂直方向のスクロールバー領域上でマウスホイールが回転されましたので、回転方向に合わせて行番号領域をスクロールします。
    this.lineNumberArea.addEventListener("wheelVirticalScrollbarArea", (event) => {
      this.lineNumberArea.scrollTop += event.detail.scrollSize;
    });
  };

  /**
   * 行番号のフォーカス状態を更新します。
   * @param {null|number} newIndex フォーカスする行番号を指すインデックスです。
   */
  updateFocusLineNumber = (newIndex) => {
    if (this.focusedLineNumberIndex !== null && this.lineNumbers[this.focusedLineNumberIndex]) {
      this.lineNumbers[this.focusedLineNumberIndex].classList.remove("tom-editor__line-number-area__line-number--focus");
    }
    this.focusedLineNumberIndex = newIndex;
    if (newIndex === null) {
      return;
    }
    this.lineNumbers[this.focusedLineNumberIndex].classList.add("tom-editor__line-number-area__line-number--focus");
  };
};

export {
  LineNumberArea
}
