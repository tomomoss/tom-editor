import "./common.scss";

import {
  Caret
} from "./caret";
import {
  Editor
} from "./editor";
import {
  HorizontalScrollbarArea
} from "./horizontal-scrollbar-area";
import {
  LineNumberArea
} from "./line-number-area";
import {
  TextArea
} from "./text-area";
import {
  VerticalScrollbarArea
} from "./vertical-scrollbar-area";
import {
  Underline
} from "./underline";

/**
 * ライブラリ「TOM Editor」のエントリポイントです。
 * 当コンストラクタは外部に露出するため厳格な引数検査を実施します。
 * @param {HTMLElement} editorContainer エディター実装対象となるHTML要素です。
 * @param {TOMEditorOption} editorOption エディターの挙動を制御する引数です。省略可能です。
 * @param {...any} rest ※引数検査用の引数です。
 */
const Main = class extends EventTarget implements Main {
  constructor(editorContainer: HTMLElement, editorOption: TOMEditorOption, ...rest: any) {
    super();
    if (typeof editorContainer === "undefined") {
      throw new Error("第1引数が指定されていません。第1引数にはエディター実装対象となるHTML要素を指定してください。");
    }
    if (!(editorContainer instanceof HTMLElement)) {
      throw new Error(`第1引数に${typeof editorContainer}型の値が指定されています。第1引数にはエディター実装対象となるHTML要素を指定してください。`);
    }
    if (typeof editorOption !== "undefined") {
      if (typeof editorOption !== "object") {
        throw new Error(`第2引数に${typeof editorOption}型の値が指定されています。第2引数にはエディターの挙動を制御するオブジェクトを指定してください。`);
      }
      for (const key in editorOption) {
        if (key === "readonly") {
          if (typeof editorOption.readonly !== "boolean") {
            throw new Error("第2引数のキー「readonly」には真偽値を指定してください。");
          }
          continue;
        }
        throw new Error(`第2引数のキー「${key}」は有効なキー名として許可されていません。`);
      }
    }
    if (rest.length) {
      throw new Error("引数の数が不正です。当コンストラクタは第1引数と第2引数のみ許容します。");
    }

    // エディター実装対象となるHTML要素の中身は空にしておきます。
    // 1つのHTML要素に複数のエディターが実装されるのは想定外の挙動であるのと、
    // こちらが把握できないHTML要素が入っているときの挙動が想定できないためです。
    editorContainer.innerHTML = "";

    // エディターの挙動を制御するオブジェクトの値を利用できる状態に加工します。
    let readonlyFlag: boolean;
    if (typeof editorOption === "undefined" || typeof editorOption.readonly === "undefined") {
      readonlyFlag = false;
    } else {
      readonlyFlag = editorOption.readonly;
    }

    // エディターを構成する主要な要素を2段階に分けて初期化します。
    // まずは各々でできる範囲内で初期化し、それが終わったら他要素の値・状態を利用して2度目の初期化を行います。
    const editor = new Editor(this, editorContainer);
    const lineNumberArea = new LineNumberArea(this, readonlyFlag);
    const textArea = new TextArea(this, readonlyFlag);
    const verticalScrollbarArea = new VerticalScrollbarArea(this, readonlyFlag);
    const horizontalScrollbarArea = new HorizontalScrollbarArea(this, readonlyFlag);
    const caret = new Caret(this, readonlyFlag);
    const underline = new Underline(this, readonlyFlag);
    this.dispatchEvent(new CustomEvent("Main-initialize", {
      detail: {
        editor: editor.editor
      } as MainInitializeEvent
    }));
  }
};

export {
  Main as TOMEditor
}
