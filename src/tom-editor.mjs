"use strict";

import "./tom-editor.scss";

import {
  Caret
} from "./tom-editor.caret.mjs";
import {
  DecorationUnderline
} from "./tom-editor.decoration-under-line.mjs";
import {
  HorizontalScrollbarArea
} from "./tom-editor.horizontal-scorllbar-area.mjs";
import {
  LineNumberArea
} from "./tom-editor.line-number-area.mjs";
import {
  TextArea
} from "./tom-editor.text-area.mjs";
import {
  VirticalScrollbarArea
} from "./tom-editor.virtical-scorllbar-area.mjs";

/**
 * 簡素なエディターです。
 * 当コンストラクタは外部に露出するため引数検査を実施します。
 * @param {Element} editorContainer エディターの実装対象となるHTML要素です。
 * @param {object} option エディターの挙動を制御する引数です。省略可能です。
 * @param {...any} rest ※引数検査用の引数です。
 */
const TOMEditor = class {
  constructor(editorContainer, option, ...rest) {
    if (typeof editorContainer === "undefined") {
      throw new TypeError("第1引数が指定されていません。");
    }
    if (!editorContainer instanceof Element) {
      throw new TypeError("第1引数がElement型ではありません。");
    }
    if (typeof option !== "undefined") {
      if (typeof option !== "object") {
        throw new TypeError("第2引数がObject型ではありません。");
      }
      for (const key in option) {
        if (key === "readonly") {
          if (typeof option.readonly !== "boolean") {
            throw new Error("キー「readonly」には真偽値を指定してください。");
          }
          continue;
        }
        if (key !== "readonly") {
          throw new Error(`キー「${key}」はキー名として許可されていません。`);
        }
      }
    }
    if (rest.length) {
      throw new TypeError("引数の数が不正です。");
    }
    Object.seal(this);

    // 1つのHTML要素の直下にTOM Editorが複数実装されないように、実装前に当該HTML要素の内容を消去します。
    editorContainer.innerHTML = "";

    // エディターの挙動を制御するオプションの値を利用できる状態に加工します。
    let readonlyFlag;
    if (typeof option === "undefined") {
      readonlyFlag = false;
    } else {
      readonlyFlag = option.readonly;
    }

    // エディターを構成する主要な要素を初期化します。
    const editorWrapper = this.createEditorWrapper();
    editorContainer.appendChild(editorWrapper);
    this.editor = this.createEditor();
    editorWrapper.appendChild(this.editor);
    this.lineNumberArea = new LineNumberArea(this.editor, readonlyFlag);
    this.textArea = new TextArea(this.editor, readonlyFlag);
    this.virticalScrollbarArea = new VirticalScrollbarArea(this.editor, readonlyFlag);
    const textAreaLeft = this.textArea.textArea.getBoundingClientRect().left - this.editor.getBoundingClientRect().left;
    this.horizontalScrollbarArea = new HorizontalScrollbarArea(this.editor, textAreaLeft, readonlyFlag);
    this.caret = new Caret(this.editor, readonlyFlag);
    this.decorationUnderline = new DecorationUnderline(this.editor, textAreaLeft, readonlyFlag);
    this.setEventListeners(this.horizontalScrollbarArea.horizontalScrollbarArea, readonlyFlag);
  };

  /**
   * エディターに入力されている値を取得するPublic APIです。
   * @returns {string} 入力されている内容を文字列化したものです。
   */
  get value() {
    let convertedText = "";
    for (let i = 0; i < this.textArea.characters.length; i += 1) {
      for (let j = 0; j < this.textArea.characters[i].length; j += 1) {
        if (j === this.textArea.characters[i].length - 1) {
          if (i === this.textArea.characters.length - 1) {
            break;
          }
          convertedText += "\n";
          break;
        }
        convertedText += this.textArea.characters[i][j].textContent;
      }
    }
    return convertedText;
  }

  /**
   * エディターの内容を外部から指定するPublic APIです。
   * セッターは外部に露出するため引数検査を実施します。
   * @param {string} newValue 新しい内容です。
   */
  set value(newValue) {
    if (typeof newValue !== "string") {
      throw new TypeError("第1引数がstring型ではありません。");
    }
    this.textArea.characters = [];
    this.textArea.focusedColumnIndex = null;
    this.textArea.focusedRowIndex = null;
    this.textArea.selectionRange = [];
    this.textArea.textLines = [];
    this.textArea.textArea.textContent = "";
    for (const textLineOfNewValue of newValue.split("\n")) {
      const textLine = this.textArea.createTextLine();
      this.textArea.textLines.push(textLine);
      this.textArea.characters.push([]);
      for (const characterOfNewValue of textLineOfNewValue) {
        const character = this.textArea.createCharacter(characterOfNewValue);
        this.textArea.characters[this.textArea.characters.length - 1].push(character);
        textLine.appendChild(character);
      }
      const EOL = this.textArea.createEOL();
      this.textArea.characters[this.textArea.characters.length - 1].push(EOL);
      textLine.appendChild(EOL);
      this.textArea.textArea.appendChild(textLine);
    }
    this.textArea.dispatchEvents();
  }

  /**
   * エディターの入力内容が変更されたときに実行する関数を指定するPublic APIです。
   * セッターは外部に露出するため引数検査を実施します。
   * @param {Function} handler 入力内容変更時に呼び出す関数です。
   */
  set valueObserver(handler) {
    if (typeof handler !== "function") {
      throw new TypeError("第1引数がFunction型ではありません。");
    }
    this.editor.addEventListener("custom-compositionend", () => {
      if (this.textArea.differenceBetweenCurrentAndHistory()) {
        handler(this.value);
        return;
      }
    });
    new MutationObserver(() => {
      if (this.textArea.isComposing) {
        return;
      }
      handler(this.value);
    }).observe(this.textArea.textArea, {
      childList: true,
      subtree: true
    });;
  }

  /** @type {Caret} キャレットです。 */
  caret;

  /** @type {object} 当クラス内で使用するCSSクラスです。 */
  CSSClass = {
    editor: {
      element: "tom-editor__editor"
    },
    editorWrapper: {
      element: "tom-editor__editor-wrapper"
    }
  };

  /** @type {DecorationUnderline} 装飾下線です。 */
  decorationUnderline;

  /** @type {HTMLDivElement} エディター本体です。 */
  editor;

  /** @type {HorizontalScrollbarArea} 水平スクロールバー領域です。 */
  horizontalScrollbarArea;

  /** @type {LineNumberArea} 行番号領域です。 */
  lineNumberArea;

  /** @type {TextArea} 文字領域です。 */
  textArea;

  /** @type {VirticalScrollbarArea} 垂直スクロールバー領域です。 */
  virticalScrollbarArea;

  /**
   * エディター本体を生成します。
   * @returns {HTMLDivElement} エディター本体です。
   */
  createEditor = () => {
    const editor = document.createElement("div");
    editor.classList.add(this.CSSClass.editor.element);
    return editor;
  };

  /**
   * エディター本体のラッパー要素を生成します。
   * @returns {HTMLDivElement} エディター本体のラッパー要素です。
   */
  createEditorWrapper = () => {
    const editorWrapper = document.createElement("div");
    editorWrapper.classList.add(this.CSSClass.editorWrapper.element);
    return editorWrapper;
  };

  /**
   * イベントリスナーを実装します。
   * @param {HTMLDivElement} horizontalScrollbarArea 水平スクロールバー領域です。
   * @param {boolean} readonlyFlag 読みとり専用状態にするならばtrueが入っています。
   */
  setEventListeners = (horizontalScrollbarArea, readonlyFlag) => {

    // マウスホイールの操作によるスクロール量です。
    const absoluteScrollSize = parseFloat(getComputedStyle(this.editor).lineHeight) * 3.5;

    // タッチ操作で最後に検知された水平座標です。
    let lastTouchX = null;

    // タッチ操作で最後に検知された垂直座標です。
    let lastTouchY = null;

    // mousedownイベントによってキャレットを配置しようとするとき、
    // どういうわけかmousedownした瞬間にblurしてしまうためmousedownイベントの既定の動作を実行しないようにしています。
    // 各要素に以下処理を実装してもよいのですが面倒くさいのでエディター本体を対象に実装しています。
    this.editor.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });

    // エディター上でmousemoveイベントが発生したことを通知するだけの役割です。
    this.editor.addEventListener("mousemove", (event) => {
      this.editor.dispatchEvent(new CustomEvent("custom-mousemove", {
        detail: {
          target: event.target,
          x: event.x,
          y: event.y
        }
      }));
    });

    // タッチによるドラッグ移動処理のフラグを下ろします。
    this.editor.addEventListener("touchend", () => {
      lastTouchX = null;
      lastTouchY = null;
    });

    // フラグが立っているならばタッチ操作によるスクロール処理を実行します。
    this.editor.addEventListener("touchmove", (event) => {
      if (lastTouchX !== null) {
        this.editor.dispatchEvent(new CustomEvent("custom-scrollHorizontally", {
          detail: {
            scrollSize: event.touches[0].pageX - lastTouchX
          }
        }));
        lastTouchX = event.touches[0].pageX;
      }
      if (lastTouchY !== null) {
        this.editor.dispatchEvent(new CustomEvent("custom-scrollVertically", {
          detail: {
            scrollSize: event.touches[0].pageY - lastTouchY
          }
        }));
        lastTouchY = event.touches[0].pageY;
      }
    });

    // タッチによるドラッグ移動処理のフラグを立てます。
    this.editor.addEventListener("touchstart", (event) => {
      lastTouchX = event.touches[0].pageX;
      lastTouchY = event.touches[0].pageY;
    });

    // wheelイベントが発生したとき、発生位置によって垂直スクロールか水平スクロール化を判定して、
    // それぞれに対応したEventTarget.dispatchEvenメソッドを実行します。
    // 各要素に実装してもいいのですが面倒くさいのでエディター本体を対象にまとめて実装しています。
    this.editor.addEventListener("wheel", (event) => {
      const scrollSIze = Math.sign(event.deltaY) * absoluteScrollSize;

      // WheelEvent.pathプロパティが非標準につき一部のブラウザで実装されていないので、
      // 当該プロパティと同等の結果を内包する配列を用意して、それを利用することにします。
      const path = [];
      let checkingTarget = event.target;
      while (checkingTarget !== null) {
        path.push(checkingTarget);
        checkingTarget = checkingTarget.parentElement;
      }

      if (path.includes(horizontalScrollbarArea)) {
        this.editor.dispatchEvent(new CustomEvent("custom-scrollHorizontally", {
          detail: {
            scrollSize: scrollSIze
          }
        }));
      } else {
        this.editor.dispatchEvent(new CustomEvent("custom-scrollVertically", {
          detail: {
            scrollSize: scrollSIze
          }
        }));
      }
    });

    // 他要素にmouseupイベントが発生したことを通知するだけの役割です。
    window.addEventListener("mouseup", () => {
      this.editor.dispatchEvent(new CustomEvent("custom-mouseup"));
    });

    // 読みとり専用状態にする場合は一部のイベントリスナーを省略します。
    // 以下、読み取り専用状態時は省略する値やイベントリスナーです。
    if (!readonlyFlag) {

      // ※エディター本体には省略される値やイベントリスナーはありません。
    }
  };
};

export {
  TOMEditor
}
