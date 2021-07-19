"use strict";

import {
  Caret
} from "./tom-editor.caret.mjs";
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
 * エディターの本体を表すとともに、エディターを構成する複数のクラスのなかで最上位となるクラスです。
 * エディターに対するユーザーの操作を検知し、適切なクラスに検知した情報を伝達します。
 * また、クラス間での値や情報の仲介も担います。
 */
const TOMEditor = class {

  /**
   * エディターを初期化します。
   * 当コンストラクタは外部に露出するため引数検査を実施します。
   * @param {Element} editorContainer エディター機能を実装するHTML要素です。
   * @param {...any} rest 引数検査のためだけに存在する引数です。
   */
  constructor(editorContainer, ...rest) {
    if (typeof editorContainer === "undefined") {
      throw new Error("第1引数が指定されていません。");
    }
    if (!(editorContainer instanceof Element)) {
      throw new Error("第1引数がHTML要素ではありません。");
    }
    if (rest.length !== 0) {
      throw new Error("引数の数が不正です。");
    }
    Object.seal(this);

    // エディター本体を初期化します。
    this.root = document.createElement("div");
    this.root.style.display = "flex";
    this.root.style.font = "normal 1rem/1rem Consolas, 'Courier New', monospace";
    this.root.style.height = "100%";
    this.root.style.position = "relative";
    this.root.style.whiteSpace = "pre";
    editorContainer.appendChild(this.root);

    // エディターを構成する各領域を初期化します。
    this.lineNumberArea = new LineNumberArea(this.root);
    this.textArea = new TextArea(this.root);
    this.virticalScrollbarArea = new VirticalScrollbarArea(this.root);
    this.horizontalScrollbarArea = new HorizontalScrollbarArea(
      this.root,
      this.lineNumberArea.root.getBoundingClientRect().width,
      this.virticalScrollbarArea.root.getBoundingClientRect().width
    );
    this.caret = new Caret(this.root);

    // イベントリスナーを実装します。
    this.addEventListenersIntoEditor();
    this.addEventListenersIntoTextArea();
    this.addEventListenersIntoVirticalScrollbar();
    this.addEventListenersIntoVirticalScrollbarArea();
    this.addEventListenersIntoHorizontalScrollbar();
    this.addEventListenersIntoHorizontalScrollbarArea();
    this.addEventListenersIntoCaret();
  }

  /** @type {Caret} キャレットです。 */
  caret;

  /** @type {HorizontalScrollbarArea} 横方向のスクロールバー領域です。 */
  horizontalScrollbarArea

  /** @type {number} ドラッグ中ならば数値が入ります。 */
  horizontalScrollbarIsDragging;

  /** @type {LineNumberArea} 行番号領域です。 */
  lineNumberArea;

  /** @type {Element} 自身（エディター本体）を表すHTML要素です。 */
  root;

  /** @type {TextArea} 文字領域です。 */
  textArea;

  /** @type {VirticalScrollbarArea} 縦方向のスクロールバー領域です。 */
  virticalScrollbarArea;

  /** @type {number} ドラッグ中ならば数値が入ります。 */
  virticalScrollbarIsDragging;

  /**
   * キャレットを対象としたイベントリスナーを実装します。
   */
  addEventListenersIntoCaret = () => {

    // キャレットがDOM上に存在するときにキーが押された場合は押されたキーに応じた処理を実行します。
    // また、Shiftキー・Ctrlキーのフラグの起動操作も当イベントリスナーの範疇です。
    this.caret.root.addEventListener("keydown", (event) => {

      // Shifキーが押されているかどうかをTextAreaオブジェクトに伝達します。
      this.textArea.duringSelectionRange = event.shiftKey;

      // 押されたキーに応じた処理を実行します。
      // 何らかの処理が実行された場合は、さらに追加で処理を実行します。
      if (this.reflectMousedownKey(event)) {
        this.reflectChangesInTextAreaToOtherArea();
      }
    });
  };

  /**
   * エディター自体やブラウザウィンドウを対象としたイベントリスナーを実装します。
   */
  addEventListenersIntoEditor = () => {

    // ResizeObserverクラスを使用して、エディターの寸法変更イベントを検知します。
    // 行番号領域・文字領域の余白の縦幅を調整します。
    const resizeObserver = new ResizeObserver(() => {
      this.lineNumberArea.resetNegativeSpaceHeight();
      this.textArea.resetNegativeSpaceHeight();
      this.resetScrollbar();
    });
    resizeObserver.observe(this.root);

    // エディター外をクリックされたときはキャレットを取り除きます。
    window.addEventListener("mousedown", (event) => {

      // どこかをクリックするたびに勝手にキャレット（textareaタグ）にフォーカスしたり、
      // フォーカスを外したりと悪さをするのでこの命令文で変な挙動を中止させています。
      event.preventDefault();

      for (const element of event.path) {
        if (element === this.root) {
          return;
        }
      }
      this.textArea.resetFocusAndSelectionRange();
      this.caret.blurCaret();
      this.lineNumberArea.resetLineNumber();
    });

    // ドラッグ処理各種のフラグを解除します。
    window.addEventListener("mouseup", () => {
      this.textArea.duringSelectionRange = false;
      this.horizontalScrollbarIsDragging = undefined;
      this.virticalScrollbarIsDragging = undefined;
    });

    // ブラウザからフォーカスが外れたときはキャレットを取り除きます。
    window.addEventListener("blur", () => {
      this.textArea.resetFocusAndSelectionRange();
      this.caret.blurCaret();
      this.lineNumberArea.resetLineNumber();
    });

    // マウスホイールが操作されたときはスクロール処理を実行します。
    this.root.addEventListener("wheel", (event) => {
      if (Math.sign(event.deltaY) === -1) {
        this.scrollEditor(event.target, "previous");
        return;
      }
      if (Math.sign(event.deltaY) === 1) {
        this.scrollEditor(event.target, "next");
        return;
      }
    });

    // ドラッグ系の処理の制御を行っています。
    this.root.addEventListener("mousemove", (event) => {

      // 垂直スクロールバーのドラッグ処理です。
      if (typeof this.virticalScrollbarIsDragging !== "undefined") {
        this.scrollEditorByDraggingVirticalScrollbar(event.y);
        return;
      }

      // 水平スクロールバーのドラッグ処理です。
      if (typeof this.horizontalScrollbarIsDragging !== "undefined") {
        this.scrollEditorByDraggingHorizontalScrollbar(event.x);
        return;
      }
    });
  };

  /**
   * 文字領域を対象としたイベントリスナーを実装します。
   */
  addEventListenersIntoTextArea = () => {

    // クリックされた場所に応じてキャレットを配置します。
    this.textArea.root.addEventListener("mousedown", (event) => {
      this.textArea.duringSelectionRange = true;
      this.textArea.resetFocusAndSelectionRange();
      this.textArea.identifyCharacterForPlacingCaret(event);
      this.reflectChangesInTextAreaToOtherArea();
    });

    // ドラッグによる範囲選択処理です。
    this.textArea.root.addEventListener("mousemove", (event) => {
      if (this.textArea.duringSelectionRange) {
        this.textArea.updateSelectionRangeByMouseDragging(event);
        this.reflectChangesInTextAreaToOtherArea();
        return;
      }
    });
  };

  /**
   * 水平方向のスクロールバーを対象としたイベントリスナーを実装します。
   */
  addEventListenersIntoHorizontalScrollbar = () => {

    // スクロールバーのドラッグ移動処理のフラグを起動します。
    this.horizontalScrollbarArea.horizontalScrollbar.addEventListener("mousedown", (event) => {
      this.horizontalScrollbarIsDragging = event.x;
    });
  };

  /**
   * 水平方向のスクロールバー領域を対象としたイベントリスナーを実装します。
   */
  addEventListenersIntoHorizontalScrollbarArea = () => {

    // 領域の余白部分をクリックしたときは、マウスホイール操作と同等のスクロール処理を実行します。
    this.horizontalScrollbarArea.root.addEventListener("mousedown", (event) => {
      if (event.target === this.horizontalScrollbarArea.horizontalScrollbar) {
        return;
      }
      if (event.offsetX < parseInt(this.horizontalScrollbarArea.horizontalScrollbar.style.left)) {
        this.scrollEditor(event.target, "previous");
        return;
      }
      this.scrollEditor(event.target, "next");
    });
  };

  /**
   * 垂直方向のスクロールバーを対象としたイベントリスナーを実装します。
   */
  addEventListenersIntoVirticalScrollbar = () => {

    // スクロールバーのドラッグ移動処理のフラグを起動します。
    this.virticalScrollbarArea.virticalScrollbar.addEventListener("mousedown", (event) => {
      this.virticalScrollbarIsDragging = event.y;
    });
  };

  /**
   * 垂直方向のスクロールバー領域を対象としたイベントリスナーを実装します。
   */
  addEventListenersIntoVirticalScrollbarArea = () => {

    // 領域の余白部分をクリックしたときは、マウスホイール操作と同等のスクロール処理を実行します。
    this.virticalScrollbarArea.root.addEventListener("mousedown", (event) => {
      if (event.target === this.virticalScrollbarArea.virticalScrollbar) {
        return;
      }
      if (event.offsetY < parseInt(this.virticalScrollbarArea.virticalScrollbar.style.top)) {
        this.scrollEditor(event.target, "previous");
        return;
      }
      this.scrollEditor(event.target, "next");
    });
  };

  /**
   * 行番号領域と文字領域の自動スクロールを実行します。
   */
  autoScroll = () => {

    // 自動スクロール処理は必ず行番号領域・文字領域の順に行う必要があります。
    // 行番号領域のフォーカス行番号の位置を基準として、文字領域のフォーカス行をスクロールさせるのです。
    this.lineNumberArea.autoScroll();
    this.textArea.autoScroll(this.lineNumberArea.lineNumbers[this.lineNumberArea.focusedLineNumberIndex].getBoundingClientRect().top);

    this.resetScrollbar();
  };

  /**
   * 文字領域に対する変更を他の領域にも反映させます。
   */
  reflectChangesInTextAreaToOtherArea = () => {
    this.lineNumberArea.resetLineNumber(this.textArea.textLines.length, this.textArea.focusedRowIndex);
    this.autoScroll();
    this.caret.placeCaret(
      this.textArea.getFocusedCharacter().getBoundingClientRect().left - this.root.getBoundingClientRect().left,
      this.textArea.getFocusedTextLine().getBoundingClientRect().top - this.root.getBoundingClientRect().top
    );
  };

  /**
   * 押されたキーに応じた処理を実行します。
   * それら処理が実行されたときは、さらに追加で処理を実行させるためフラグとなる戻り値を返します。
   * @param {object} event EventTarget.addEventListenerメソッドのイベント情報です。
   * @returns {boolean} キーに応じた処理が実行された場合はtrueが返ります。
   */
  reflectMousedownKey = (event) => {

    // Ctrlキーが押されているときの処理は他のキー処理よりも優先されます。
    // Ctrlキーが押されている間は他のキー処理は無効化します。
    if (event.ctrlKey) {

      // 文字領域に入力された値を全て選択範囲に含めます。
      if (event.key === "a") {
        this.textArea.appendAllCharactersIntoSelectionRange();
        return true;
      }

      // 範囲選択された文字をクリップボードにコピーします。
      if (event.key === "c") {
        const text = this.textArea.convertSelectedRangeIntoText(false);
        navigator.clipboard.writeText(text);
        return true;
      }

      // クリップボードにある文字列をキャレットの位置に挿し込みます。
      if (event.key === "v") {
        navigator.clipboard.readText().then((text) => {
          for (const character of text) {

            // Async Clipboard APIで改行を取得すると「\n」ではなく「\r」「\n」の2文字で表現されます。
            // そのままDOMに突っ込むと2回改行されてしまうため「\r」は無視するようにします。
            if (character === "\r") {
              continue;
            }

            if (character === "\n") {
              this.textArea.appendTextLine();
            } else {
              this.textArea.appendCharacter(character);
            }
            this.reflectChangesInTextAreaToOtherArea();
          }
        });

        // 行番号の更新とかの諸々の処理は上でやっているためfalseを返します。
        return false;
      }

      // 範囲選択された文字を切り取ってクリップボードに移します。
      if (event.key === "x") {
        const text = this.textArea.convertSelectedRangeIntoText(true);
        navigator.clipboard.writeText(text);
        return true;
      }

      return false;
    }

    // 以下入力されたキーに応じた処理を実行します。
    for (const [condition, method, argument] of [
      [event.key.length === 1, this.textArea.appendCharacter, event.key],
      [event.key === "ArrowDown", this.textArea.resetFocusAndSelectionRange, "ArrowDown"],
      [event.key === "ArrowLeft", this.textArea.resetFocusAndSelectionRange, "ArrowLeft"],
      [event.key === "ArrowRight", this.textArea.resetFocusAndSelectionRange, "ArrowRight"],
      [event.key === "ArrowUp", this.textArea.resetFocusAndSelectionRange, "ArrowUp"],
      [event.key === "Backspace", this.textArea.removeCharacter, "Backspace"],
      [event.key === "Delete", this.textArea.removeCharacter, "Delete"],
      [event.key === "Enter", this.textArea.appendTextLine, undefined]
    ]) {
      if (condition) {
        method(argument);
        return true;
      }
    }

    return false;
  };

  /**
   * スクロールバーの寸法とスライド具合を更新します。
   */
  resetScrollbar = () => {

    // 文字領域のoffsetサイズとscrollサイズを基準にして、スクロールバーのサイズを更新します。
    // また、フォーカスしている位置を基準にスクロールバーのスライド具合も更新します。
    this.virticalScrollbarArea.resetVirticalScrollbar(this.textArea.root.offsetHeight, this.textArea.root.scrollHeight, this.textArea.root.scrollTop);
    this.horizontalScrollbarArea.resetHorizontalScrollbar(this.textArea.root.offsetWidth, this.textArea.root.scrollWidth, this.textArea.root.scrollLeft);
  };

  /**
   * エディターをスクロールさせます。
   * @param {Element} target スクロール処理の対象です。
   * @param {string} scrollOffset スクロール方向です。
   */
  scrollEditor = (target, scrollOffset) => {

    // 1度のスクロールにおいてスクロールする距離です。
    const scrollSize = parseFloat(getComputedStyle(this.root).fontSize) * 2.5;

    // 処理対象が水平方向のスクロールバーであるかどうかで処理を分けます。
    // 行番号領域・文字領域をスクロールさせます。
    if (target === this.horizontalScrollbarArea.root || target === this.horizontalScrollbarArea.horizontalScrollbar) {
      if (scrollOffset === "previous") {
        this.textArea.scrollHorizontally(-scrollSize);
      } else if (scrollOffset === "next") {
        this.textArea.scrollHorizontally(scrollSize);
      }
    } else {
      if (scrollOffset === "previous") {
        this.lineNumberArea.scrollVertically(-scrollSize);
        this.textArea.scrollVertically(-scrollSize);
      } else if (scrollOffset === "next") {
        this.lineNumberArea.scrollVertically(scrollSize);
        this.textArea.scrollVertically(scrollSize);
      }
    }

    // 行番号領域・文字領域のスクロールに合わせて、水平・垂直双方のスクロールバーの状態を更新します。
    this.resetScrollbar();

    // フォーカス中ならばキャレットの位置も更新します。
    if (typeof this.textArea.focusedRowIndex === "undefined") {
      return;
    }
    this.caret.placeCaret(
      this.textArea.getFocusedCharacter().getBoundingClientRect().left - this.root.getBoundingClientRect().left,
      this.textArea.getFocusedTextLine().getBoundingClientRect().top - this.root.getBoundingClientRect().top
    );
  };

  /**
   * 水平スクロールバーのドラッグによるエディターのスクロール処理です。
   * @param {number} dragEventX ドラッグイベントが生じた水平方向の座標です。
   */
  scrollEditorByDraggingHorizontalScrollbar = (dragEventX) => {

    // スクロール量を求めます。
    const dragSize = dragEventX - this.horizontalScrollbarIsDragging;
    this.horizontalScrollbarIsDragging = dragEventX;
    const pxWhichIsEquivalentTo1pxOfTextArea = this.textArea.root.scrollWidth / this.textArea.root.offsetWidth;
    const scrollSize = dragSize * pxWhichIsEquivalentTo1pxOfTextArea;

    // スクロールします。
    this.textArea.scrollHorizontally(scrollSize);
    this.horizontalScrollbarArea.resetHorizontalScrollbar(this.textArea.root.offsetWidth, this.textArea.root.scrollWidth, this.textArea.root.scrollLeft);

    // フォーカス中ならばキャレットの位置も更新します。
    if (typeof this.textArea.focusedRowIndex === "undefined") {
      return;
    }
    this.caret.placeCaret(
      this.textArea.getFocusedCharacter().getBoundingClientRect().left - this.root.getBoundingClientRect().left,
      this.textArea.getFocusedTextLine().getBoundingClientRect().top - this.root.getBoundingClientRect().top
    );
  };

  /**
   * 垂直スクロールバーのドラッグによるエディターのスクロール処理です。
   * @param {number} dragEventY ドラッグイベントが生じた垂直方向の座標です。
   */
  scrollEditorByDraggingVirticalScrollbar = (dragEventY) => {

    // スクロール量を求めます。
    const dragSize = dragEventY - this.virticalScrollbarIsDragging;
    this.virticalScrollbarIsDragging = dragEventY;
    const pxWhichIsEquivalentTo1pxOfTextArea = this.textArea.root.scrollHeight / this.textArea.root.offsetHeight;
    const scrollSize = dragSize * pxWhichIsEquivalentTo1pxOfTextArea;

    // スクロールします。
    this.lineNumberArea.scrollVertically(scrollSize);
    this.textArea.scrollVertically(scrollSize);
    this.virticalScrollbarArea.resetVirticalScrollbar(this.textArea.root.offsetHeight, this.textArea.root.scrollHeight, this.textArea.root.scrollTop);

    // フォーカス中ならばキャレットの位置も更新します。
    if (typeof this.textArea.focusedRowIndex === "undefined") {
      return;
    }
    this.caret.placeCaret(
      this.textArea.getFocusedCharacter().getBoundingClientRect().left - this.root.getBoundingClientRect().left,
      this.textArea.getFocusedTextLine().getBoundingClientRect().top - this.root.getBoundingClientRect().top
    );
  };
};

export {
  TOMEditor
}
