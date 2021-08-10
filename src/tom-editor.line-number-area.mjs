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
    this.editor = editor;
    this.lineNumberArea = this.createLineNumberArea();
    this.editor.appendChild(this.lineNumberArea);
    this.appendLineNumber();

    // 行番号領域の横幅を求めます。
    // 横幅は「半角英数字の横幅 * 表示する桁数 + 行番号のpadding-rightプロパティの値」とします。
    // 表示する桁数ですがそのまま指定するとエディターの縁との隙間がほとんどないので少し余裕をもたせます。
    const temporaryElement = document.createElement("span");
    temporaryElement.innerHTML = "0";
    temporaryElement.style.display = "inline-block";
    this.lineNumberArea.appendChild(temporaryElement);
    const alphanumericWidth = temporaryElement.clientWidth;
    temporaryElement.remove();
    const maximumNumberOfDigits = 4.5;
    const lineNumberPaddingRight = parseFloat(getComputedStyle(this.lineNumbers[0]).paddingRight);
    this.lineNumberArea.style.flexBasis = `${alphanumericWidth * maximumNumberOfDigits + lineNumberPaddingRight}px`;

    // this.setEventListeners();
  }

  /** @type {object} 当クラス内で使用するCSSクラスです。 */
  CSSClass = {
    lineNumber: {
      element: "tom-editor__line-number-area__line-number",
      modifier: {
        focus: "tom-editor__line-number-area__line-number--focus"
      }
    },
    lineNumberArea: {
      element: "tom-editor__line-number-area"
    }
  };

  /** @type {HTMLDivElement} エディター本体です。 */
  editor;

  /** @type {null|number} フォーカスしている行番号を指すインデックスです。 */
  focusedLineNumberIndex = null;

  /** @type {null|number} ドラッグ処理で最後に参照した行のインデックス値が入ります。 */
  lastDragedIndex = null;

  /** @type {HTMLDivElement} 行番号領域です */
  lineNumberArea;

  /** @type {Array<HTMLDivElement>} 現在Webページに挿入されている行番号です。 */
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
    lineNumber.classList.add(this.CSSClass.lineNumber.element);
    lineNumber.innerHTML = this.lineNumbers.length + 1;
    return lineNumber;
  };

  /**
   * 行番号領域を生成します。
   * @returns {HTMLDivElement} 行番号領域です。
   */
  createLineNumberArea = () => {
    const lineNumberArea = document.createElement("div");
    lineNumberArea.classList.add(this.CSSClass.lineNumberArea.element);
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
   */
  setEventListeners = () => {

    // 行番号がクリックされたときは、文字領域にクリックされた行番号を通知します。
    // また、ドラッグフラグを起動します。
    this.lineNumberArea.addEventListener("mousedown", (event) => {
      this.lastDragedIndex = this.lineNumbers.findIndex((lineNumber) => {
        return lineNumber === event.target;
      });
      this.editor.dispatchEvent(new CustomEvent("lineNumberArea -> textArea", {
        detail: {
          mousedownIndex: this.lastDragedIndex
        }
      }));
    });

    // 行番号領域上でマウスホイールが操作されたのでスクロール処理を実行します。
    this.lineNumberArea.addEventListener("wheel", (event) => {
      const scrollSize = Math.sign(event.deltaY) * parseFloat(getComputedStyle(this.lineNumberArea).fontSize) * 3;
      this.lineNumberArea.scrollTop += scrollSize;
      this.editor.dispatchEvent(new CustomEvent("lineNumberArea -> textArea", {
        detail: {
          scrollSize: scrollSize
        }
      }));
    });

    // エディター本体からの通知です。
    this.editor.addEventListener("editor -> lineNumberArea", (event) => {

      // ドラッグ操作による範囲選択処理以外では後続の処理は走りません。
      if (this.lastDragedIndex === null || !event.detail.target.classList.contains(this.CSSClass.lineNumber.element)) {
        return;
      }

      // mousemoveイベントが発生した対象を求めます。
      // 最後に発生した対象と同じであればすることがないので処理から抜けます。
      const targetIndex = this.lineNumbers.findIndex((lineNumber) => {
        return lineNumber === event.detail.target;
      });
      if (targetIndex === this.lastDragedIndex) {
        return;
      }

      this.editor.dispatchEvent(new CustomEvent("lineNumberArea -> textArea", {
        detail: {
          mousemoveIndex: targetIndex
        }
      }));
    });

    // 文字領域からの通知です。
    this.editor.addEventListener("textArea -> lineNumberArea", (event) => {
      this.adjustNumberOfLineNumbers(event.detail.length);
      this.updateFocusLineNumber(event.detail.index);
      this.lineNumberArea.scrollTop = event.detail.scrollTop;
    });

    // 垂直スクロールバー領域からの通知です。
    this.editor.addEventListener("virticalScrollbarArea -> lineNumberArea", (event) => {

      // event.detail.scrollSizeプロパティがあるときは、同領域の余白がクリックされてスクロールが発生したことを意味します。
      if (event.detail.scrollSize) {
        this.lineNumberArea.scrollTop += event.detail.scrollSize;
      }

      // event.detail.scrollRatioプロパティがあるときは、ドラッグ操作によるスクロールが行われたことを意味します。
      if (event.detail.scrollRatio) {
        this.lineNumberArea.scrollTop += this.lineNumberArea.scrollHeight * event.detail.scrollRatio;
      }
    });

    // キャレットからの通知です。
    this.editor.addEventListener("caret -> lineNumberArea", (event) => {
      this.updateFocusLineNumber(event.detail.index);
    });

    // windowオブジェクトからの通知です。
    this.editor.addEventListener("window -> lineNumberArea", () => {
      this.lastDragedIndex = null;
    });
  };

  /**
   * 行番号のフォーカス状態を更新します。
   * @param {null|number} index フォーカスする行番号を指すインデックスです。
   */
  updateFocusLineNumber = (index) => {

    // 引数にnullが指定されているということはフォーカスする行番号がないということなので、フォーカス状態を解除します。
    if (index === null) {
      if (this.focusedLineNumberIndex === null) {
        return;
      }
      if (this.lineNumbers[this.focusedLineNumberIndex].classList.contains(this.CSSClass.lineNumber.modifier.focus)) {
        this.lineNumbers[this.focusedLineNumberIndex].classList.remove(this.CSSClass.lineNumber.modifier.focus);
      }
      return;
    }

    // 引数で指定された行番号とフォーカスしている行番号が同じ場合は、何もすることがないので処理から抜けます。
    if (index === this.focusedLineNumberIndex) {
      return;
    }

    if (this.focusedLineNumberIndex !== null) {
      this.lineNumbers[this.focusedLineNumberIndex].classList.remove(this.CSSClass.lineNumber.modifier.focus);
    }
    this.focusedLineNumberIndex = index;
    this.lineNumbers[this.focusedLineNumberIndex].classList.add(this.CSSClass.lineNumber.modifier.focus);
  };
};

export {
  LineNumberArea
}
