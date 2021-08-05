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
 * エディターの本体を表すとともにエディターを構成する複数のクラスのなかで最上位となるクラスです。
 * エディターに対するユーザーの操作を検知して適切なクラスに検知したイベントを伝達します。
 */
const TOMEditor = class {

  /**
   * エディター本体を初期化します。
   * 当コンストラクタは外部に露出するため引数検査を実施します。
   * @param {Element} tomEditorContainer エディター機能を実装するHTML要素です。
   * @param {...any} rest 引数検査のためだけに存在する引数です。
   */
  constructor(tomEditorContainer, ...rest) {
    if (typeof tomEditorContainer === "undefined") {
      throw new Error("第1引数が指定されていません。");
    }
    if (!tomEditorContainer instanceof Element) {
      throw new Error("第1引数がHTML要素ではありません。");
    }
    if (rest.length) {
      throw new Error("引数の数が不正です。");
    }

    // 1つのHTML要素の直下にTOM Editorが複数実装されないように、実装前に当該HTML要素の内容を消去します。
    tomEditorContainer.innerHTML = "";

    // エディターを構成する各要素を初期化します。
    const editor = this.createEditor(tomEditorContainer);
    tomEditorContainer.appendChild(editor);
    const lineNumberArea = new LineNumberArea(editor);
    const textArea = new TextArea(editor);
    const virticalScrollbarArea = new VirticalScrollbarArea(editor);
    const textAreaBoundingClientRect = textArea.textArea.getBoundingClientRect();
    const horizontalScrollbarArea = new HorizontalScrollbarArea(editor, textAreaBoundingClientRect.left, textAreaBoundingClientRect.width);
    const caret = new Caret(editor);
    const decorationUnderline = new DecorationUnderline(editor, textAreaBoundingClientRect.left, textAreaBoundingClientRect.width);
  };

  /**
   * エディター本体を生成します。
   * @returns {HTMLDivElement} エディター本体です。
   */
  createEditor = () => {
    const editor = document.createElement("div");
    editor.classList.add("tom-editor");
    return editor;
  };
};

export {
  TOMEditor
}
