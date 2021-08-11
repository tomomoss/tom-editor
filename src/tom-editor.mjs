"use strict";

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
 */
const TOMEditor = class {

  /**
   * エディターを初期化します。
   * 当コンストラクタは外部に露出するため引数検査を実施します。
   * @param {Element} editorContainer エディターの実装対象となるHTML要素です。
   * @param {...any} rest ※引数検査用の引数です。
   */
  constructor(editorContainer, ...rest) {
    if (typeof editorContainer === "undefined") {
      throw new Error("第1引数が指定されていません。");
    }
    if (!editorContainer instanceof Element) {
      throw new Error("第1引数がHTML要素ではありません。");
    }
    if (rest.length) {
      throw new Error("引数の数が不正です。");
    }
    Object.seal(this);

    // 1つのHTML要素の直下にTOM Editorが複数実装されないように、実装前に当該HTML要素の内容を消去します。
    editorContainer.innerHTML = "";

    // エディターを構成する主要な要素を初期化します。
    this.editor = this.createEditor();
    editorContainer.appendChild(this.editor);
    const lineNumberArea = new LineNumberArea(this.editor);
    const textArea = new TextArea(this.editor);
    const virticalScrollbarArea = new VirticalScrollbarArea(this.editor);
    const textAreaLeft = textArea.textArea.getBoundingClientRect().left - this.editor.getBoundingClientRect().left;
    const horizontalScrollbarArea = new HorizontalScrollbarArea(this.editor, textAreaLeft);
    const caret = new Caret(this.editor);
    const decorationUnderline = new DecorationUnderline(this.editor, textAreaLeft);
    this.setEventListeners(
      lineNumberArea.lineNumberArea,
      virticalScrollbarArea.virticalScrollbarArea,
      horizontalScrollbarArea.horizontalScrollbarArea
    );
  };

  /** @type {HTMLDivElement} エディター本体です。 */
  editor;

  /**
   * エディター本体を生成します。
   * @returns {HTMLDivElement} エディター本体です。
   */
  createEditor = () => {
    const editor = document.createElement("div");
    editor.classList.add("tom-editor");
    return editor;
  };

  /**
   * イベントリスナーを実装します。
   * @param {HTMLDivElement} lineNumberArea 行番号領域です。
   * @param {HTMLDivElement} virticalScrollbarArea 垂直スクロールバー領域です。
   * @param {HTMLDivElement} horizontalScrollbarArea 水平スクロールバー領域です。
   */
  setEventListeners = (lineNumberArea, virticalScrollbarArea, horizontalScrollbarArea) => {

    // マウスホイールの操作によるスクロール量です。
    const absoluteScrollSize = parseFloat(getComputedStyle(this.editor).lineHeight) * 3.5;

    // ResizeObserverオブジェクトによって最後に検知されたエディターの縦幅です。
    let lastEditorHeight;

    // ResizeObserverオブジェクトによって最後に検知されたエディターの縦幅です。
    let lastEditorWidth;

    // ResizeObserverオブジェクトを利用してエディターの寸法の変化、ひいては文字領域の寸法の変化を監視しています。
    // なぜ監視対象を文字領域にしていないのかというと、同領域にはFlexboxを適用しているために横幅の変化が思ったとおりに検知できないためです。
    // なお、縦幅の監視は文字領域に適用しても問題ないのですが、横幅を監視しているついでに監視することにしました。    
    new ResizeObserver((entries) => {
      if (entries[0].contentRect.height !== lastEditorHeight) {
        lastEditorHeight = entries[0].contentRect.height;
        this.editor.dispatchEvent(new CustomEvent("custom-resizeTextAreaHeight"));
      }
      if (entries[0].contentRect.width !== lastEditorWidth) {
        lastEditorWidth = entries[0].contentRect.width;
        this.editor.dispatchEvent(new CustomEvent("custom-resizeTextAreaWidth", {
          detail: {
            width: lastEditorWidth - lineNumberArea.offsetWidth - virticalScrollbarArea.offsetWidth
          }
        }));
      }
    }).observe(this.editor);

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

    // wheelイベントが発生したとき、発生位置によって垂直スクロールか水平スクロール化を判定して、
    // それぞれに対応したEventTarget.dispatchEvenメソッドを実行します。
    // 各要素に実装してもいいのですが面倒くさいのでエディター本体を対象にまとめて実装しています。
    this.editor.addEventListener("wheel", (event) => {
      if (event.path.includes(horizontalScrollbarArea)) {
        this.editor.dispatchEvent(new CustomEvent("custom-scrollHorizontally", {
          detail: {
            scrollSize: Math.sign(event.deltaY) * absoluteScrollSize
          }
        }));
      } else {
        this.editor.dispatchEvent(new CustomEvent("custom-scrollVertically", {
          detail: {
            scrollSize: Math.sign(event.deltaY) * absoluteScrollSize
          }
        }));
      }
    });

    // 他要素にmouseupイベントが発生したことを通知するだけの役割です。
    window.addEventListener("mouseup", () => {
      this.editor.dispatchEvent(new CustomEvent("custom-mouseup"));
    });
  };
};

export {
  TOMEditor
}
