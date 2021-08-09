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

    // 1つのHTML要素の直下にTOM Editorが複数実装されないように、実装前に当該HTML要素の内容を消去します。
    editorContainer.innerHTML = "";

    // エディターを構成する主要な要素を初期化します。
    const editor = this.createEditor();
    editorContainer.appendChild(editor);
    const lineNumberArea = new LineNumberArea(editor);
    const textArea = new TextArea(editor);
    const virticalScrollbarArea = new VirticalScrollbarArea(editor);
    const textAreaLeft = textArea.textArea.getBoundingClientRect().left - editor.getBoundingClientRect().left;
    const horizontalScrollbarArea = new HorizontalScrollbarArea(editor, textAreaLeft);
    const caret = new Caret(editor);
    // const decorationUnderline = new DecorationUnderline(tomEditor, textAreaBoundingClientRect.left, textAreaBoundingClientRect.width);

    // 各要素にイベントリスナーを実装します。
    this.setEventListeners(editor, lineNumberArea.lineNumberArea, textArea.textArea, virticalScrollbarArea.virticalScrollbarArea, horizontalScrollbarArea.horizontalScrollbarArea);
    lineNumberArea.setEventListeners(textArea.textArea);
    textArea.setEventListeners(editor, lineNumberArea.lineNumberArea, virticalScrollbarArea.virticalScrollbarArea, horizontalScrollbarArea.horizontalScrollbarArea, caret.caret);
    virticalScrollbarArea.setEventListeners(lineNumberArea.lineNumberArea, textArea.textArea);
    horizontalScrollbarArea.setEventListeners(textArea.textArea);
    caret.setEventListeners(lineNumberArea.lineNumberArea, textArea.textArea);
  };

  /** @type {number} 最後に検知されたエディターの横幅です。 */
  lastEditorWidth = null;

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
   * @param {HTMLDivElement} editor エディター本体です。
   * @param {HTMLDivElement} lineNumberArea 行番号領域です。
   * @param {HTMLDivElement} textArea 文字領域です。
   * @param {HTMLDivElement} virticalScrollbarArea 垂直方向のスクロールバー領域です。
   * @param {HTMLDivElement} horizontalScrollbarArea 水平方向のスクロールバー領域です。
   */
  setEventListeners = (editor, lineNumberArea, textArea, virticalScrollbarArea, horizontalScrollbarArea) => {

    // エディターの横幅の変更を監視しています。
    // 横幅が変化したときは文字領域の横幅、水平方向のスクロールバー領域の横幅と配置位置を調整します。
    // なぜ、それら値を監視対象にしていないかというと配置方法（Flexbox、position: absolute;）の関係上、想定どおりに動いてくれないからです。
    // 横幅が変更されたときだけ上記処理を走らせることで処理量を軽減しています。
    new ResizeObserver(() => {
      const editorRect = editor.getBoundingClientRect();
      if (editorRect.width === this.lastEditorWidth) {
        return;
      }
      this.lastEditorWidth = editorRect.width;
      textArea.dispatchEvent(new CustomEvent("resizeEditor"));
    }).observe(editor);

    // エディター内をクリックしたときにキャレットからフォーカスが外れないように、
    // mousedownイベントの標準動作を停止させます。
    editor.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });

    // 他要素にmousemoveイベントが発生したことを通知するだけの役割です。
    editor.addEventListener("mousemove", (event) => {
      virticalScrollbarArea.dispatchEvent(new CustomEvent("mousemoveEditor", {
        detail: {
          y: event.y
        }
      }));
    });

    // ホイールされた方向に応じて一定量のスクロールを各要素に通知します。
    editor.addEventListener("wheel", (event) => {
      const scrollSIze = Math.sign(event.deltaY) * parseFloat(getComputedStyle(editor).fontSize) * 3;
      for (const editorComponent of [textArea, lineNumberArea]) {
        editorComponent.dispatchEvent(new CustomEvent("wheelEditor", {
          detail: {
            scrollSize: scrollSIze
          }
        }));
      }
    });

    // 他要素にmouseupイベントが発生したことを通知するだけの役割です。
    window.addEventListener("mouseup", () => {
      virticalScrollbarArea.dispatchEvent(new CustomEvent("mouseupEditor"));
    });
  };
};

export {
  TOMEditor
}
