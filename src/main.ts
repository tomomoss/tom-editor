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
  constructor(editorContainer: HTMLElement, editorOption?: TOMEditorOption, ...rest: any) {
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
    // まずは各々でできる範囲内で初期化し、それが終わったら他要素の値・状態を利用して数回の初期化をさらに重ねます。
    this.editor = new Editor(this, readonlyFlag, editorContainer);
    this.lineNumberArea = new LineNumberArea(this, readonlyFlag);
    this.textArea = new TextArea(this, readonlyFlag);
    this.verticalScrollbarArea = new VerticalScrollbarArea(this, readonlyFlag);
    this.horizontalScrollbarArea = new HorizontalScrollbarArea(this, readonlyFlag);
    this.caret = new Caret(this, readonlyFlag);
    this.underline = new Underline(this, readonlyFlag);
    this.dispatchEvent(new CustomEvent("TOMEditor-firstinitialize", {
      detail: {
        editor: this.editor.editor,
        horizontalScrollbarArea: this.horizontalScrollbarArea.horizontalScrollbarArea
      } as TOMEditorFirstInitializeEvent
    }));
    this.dispatchEvent(new CustomEvent("TOMEditor-secondinitialize", {
      detail: {
        lineNumberAreaWidth: this.lineNumberArea.lineNumberArea.clientWidth
      } as TOMEditorSecondInitializeEvent
    }));
  }

  /**
   * ライブラリのバージョンを返すAPIです。
   * @returns {string} ライブラリのバージョンです。
   */
  static get version(): string {
    return "4.4.1";
  }

  /**
   * エディターに入力されている文章をstring型に変換して返すAPIです。
   * @returns {string} 入力されている文章です。
   */
  get value(): string {
    let convertedText = "";
    for (let i = 0; i < this.textArea.textAreaContentList.length; i += 1) {
      for (let j = 0; j < this.textArea.textAreaContentList[i].characterList.length; j += 1) {
        
        // 行末文字は改行文字（\n）に置き換えます。
        // ただし、最後の行の行末文字は無視します。
        if (j === this.textArea.textAreaContentList[i].characterList.length - 1) {
          if (i === this.textArea.textAreaContentList.length - 1) {
            break;
          }
          convertedText += "\n";
          break;
        }

        convertedText += this.textArea.textAreaContentList[i].characterList[j].textContent;
      }
    }
    return convertedText;
  }

  /**
   * 外部からエディターに入力されている内容を指定・設定するためのAPIです。
   * 当セッターは外部に露出するため厳格な引数検査を実施します。
   * @param {string} text 外部から指定された新しい文章です。
   */
  set value(text: string) {
    if (typeof text !== "string") {
      throw new Error(`引数に${typeof text}型の値が指定されています。引数にはエディターに入力したい文章をstring型で指定してください。`);
    }
    
    // まずは文字領域のプロパティを初期化します。
    this.textArea.focusPointIndex = {
      column: null,
      row: null
    };
    this.textArea.selectionRange = [];
    this.textArea.textAreaContentList = [];

    // Webページに挿入されている行・文字を全て削除します。
    this.textArea.textLinesWrapper.innerHTML = "";

    // 引数で受けとった文字列をHTML要素に置きかえてWebページに挿入していきます。
    for (const textLine of text.replace(/\r\n/, "\n").split("\n")) {

      // 行となるHTML要素を生成します。
      const newTextLine = this.textArea.createTextLine();

      // 文字となるHTML要素を生成します。
      const newCharacterList = [];
      for (const character of textLine) {
        newCharacterList.push(this.textArea.createCharacter(character));
      }
      newCharacterList.push(this.textArea.createCharacter("eol"));

      // 行のなかに文字を挿入します。
      for (const newCharacter of newCharacterList) {
        newTextLine.appendChild(newCharacter);
      }

      // 文字領域に行を挿入します。
      this.textArea.textLinesWrapper.appendChild(newTextLine);

      // TextAreaContentオブジェクトをプロパティに追加保存します。
      this.textArea.textAreaContentList.push({
        characterList: newCharacterList,
        textLine: newTextLine
      });
    }

    this.textArea.dispatchEvents();
  }

  /**
   * エディターの入力内容が変更されたときに実行するコールバック関数を指定するAPIです。
   * 当該関数の第1引数には当クラスのvalueゲッターで取得した値を渡します。
   * 当セッターは外部に露出するため厳格な引数検査を実施します。
   * @param {Function} handler 入力内容変更時に呼び出す関数です。
   */
  set valueObserver(handler: ValueObserver) {
    if (typeof handler !== "function") {
      throw new Error(`引数に${typeof handler}型の値が指定されています。引数にはエディターの入力内容が変更されたときに実行させたい関数を指定してください。`);
    }

    // 当セッターが検知する「エディターの入力内容が変更されたとき」とは半角英数字の入力時と、
    // IMEによる変換処理が終了したときのことを指します。
    new MutationObserver((): void => {
      if (this.textArea.compositionState.isComposing) {
        return;
      }
      handler(this.value);
    }).observe(this.textArea.textLinesWrapper, {
      childList: true,
      subtree: true
    });
    this.addEventListener("TOMEditor-compositionend", () => {
      handler(this.value);
    });
  }

  /** @type {Caret} キャレットを制御するオブジェクトです。 */
  private caret: InstanceType<typeof Caret>;

  /** @type {Editor} エディター本体、およびエディター外要素を制御するオブジェクトです。 */
  private editor: InstanceType<typeof Editor>;

  /** @type {HorizontalScrollbarArea} 水平スクロールバー領域を制御するオブジェクトです。 */
  private horizontalScrollbarArea: InstanceType<typeof HorizontalScrollbarArea>;

  /** @type {LineNumberArea} 行番号領域を制御するオブジェクトです。 */
  private lineNumberArea: InstanceType<typeof LineNumberArea>;

  /** @type {TextArea} 文字領域を制御するオブジェクトです。 */
  private textArea: InstanceType<typeof TextArea>;

  /** @type {Caret} フォーカス位置を強調する下線を制御するオブジェクトです。 */
  private underline: InstanceType<typeof Underline>;

  /** @type {VerticalScrollbarArea} 垂直スクロールバー領域を制御するオブジェクトです。 */
  private verticalScrollbarArea: InstanceType<typeof VerticalScrollbarArea>;
};

export {
  Main as TOMEditor
}
