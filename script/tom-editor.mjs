"use strict";

/**
 * @module tom-editor
 */

/**
 * Monaco Editorを参考に作った独自のエディターです。
 * スタイルの適用は原則としてCSSで行います。
 * どうしてもCSS側で制御できない場合はsetStyleメソッドで一括制御します。
 */
const TOMEditor = class {

  /**
   * エディターを構成する主要なHTML要素や、エディターの状態を表す値などを初期化します。
   * イベントリスナーの実装はコンストラクタ内でのみ行うようにしています。
   * コンストラクタのみ外部に出すため引数検査もコンストラクタだけは行っています。
   * @param {Element} tomEditorContainer エディター機能を実装する最上位のHTML要素です。
   * @param {...any} rest コンストラクタの引数検査のためだけに存在する引数です。
   */
  constructor(tomEditorContainer, ...rest) {
    if (typeof tomEditorContainer === "undefined") {
      throw new Error("第1引数が指定されていません。");
    }
    if (!(tomEditorContainer instanceof Element)) {
      throw new Error("第1引数がHTML要素ではありません。");
    }
    if (rest.length !== 0) {
      throw new Error("引数の数が不正です。");
    }

    // プログラムの安全性を高めるため、気休めかもしれませんがObject.sealメソッドを実行しておきます。
    Object.seal(this);

    // エディターを構成する各領域を構成するHTML要素を初期化します。
    // 以下関数群のなかではイベントリスナーは定義しません。
    this.initializeRootElement(tomEditorContainer);
    this.initializeLineNumberArea();
    this.initializeTextArea();
    this.initializeScrollbarArea();
    this.initializeHorizontalScrollbarArea();
    this.initializeCaret();

    // ここからイベントリスナーをまとめて実装します。
    // ResizeObserverオブジェクトもイベントリスナーのようなものなので以下で実装します。
    this.addEventListenersIntoCaret();
    this.addEventListenersIntoEditor();
    this.addEventListenersIntoHorizontalScrollbar();
    this.addEventListenersIntoHorizontalScrollbarArea();
    this.addEventListenersIntoLineNumberArea();
    this.addEventListenersIntoScrollbar();
    this.addEventListenersIntoScrollbarArea();
    this.addEventListenersIntoTextArea();
    this.addEventListenersIntoWindow();

    // 最後に、キャレットを1行目の1文字目に合わせるのと現在の状態を履歴に保存して初期化は完了です。
    this.placeCaret(this.textArea.firstElementChild.firstElementChild);
    this.saveHistory("initialize");
  }

  /** @type {Element} キャレットです。 */
  caret;

  /** @type {boolean} Ctrlキーが押されている間はtureが入ります。 */
  ctrlKeyPressed = false;

  /** @type {number} 現在表示している履歴のインデックス値です。 */
  currentHistoryIndex;

  /** @type {null|number} ドラッグしている間は数値が入ります。 */
  draggingHorizontalScrollbar = null;

  /** @type {null|number} ドラッグしている間は数値が入ります。 */
  draggingScrollbar = null;

  /** @type {boolean} ドラッグしている間はtureが入ります。 */
  draggingTextArea = false;

  /** @type {Element} フォーカスされている文字です。 */
  focusedCharacter;

  /** @type {Element} フォーカスされている行番号です。 */
  focusedLineNumber;

  /** @type {Element} フォーカスされている行です。 */
  focusedTextLine;

  /** @type {Array<Element>} 行番号領域の変遷の履歴です。 */
  historyOfLineNumberArea = [];

  /** @type {Array<Element>} 文字領域の変遷の履歴です。 */
  historyOfTextArea = [];

  /** @type {Element} 横方向のスクロールバーです。 */
  horizontalScrollbar;

  /** @type {Element} 横方向のスクロールバー領域です。 */
  horizontalScrollbarArea;

  /** @type {Element} 行番号領域です。 */
  lineNumberArea;

  /** @type {Element} 行番号領域の下部余白です。 */
  negativeSpaceInLineNumberArea;

  /** @type {Element} 文字領域の下部余白です。 */
  negativeSpaceInTextArea;

  /** @type {Element} エディターを構成する最上位のHTML要素です。 */
  root;

  /** @type {Element} 縦方向のスクロールバーです。 */
  scrollbar;

  /** @type {Element} 縦方向のスクロールバー領域です。 */
  scrollbarArea;

  /** @type {Array<Element>} 範囲選択された文字達です。 */
  selectedRange = [];

  /** @type {boolean} Shiftキーが押されている間はtureが入ります。 */
  shiftKeyPressed = false;

  /** @type {string} 入力途中の全角カナです。 */
  stockedJapaneseCharacters = "";

  /** @type {Element} 文字領域です。 */
  textArea;

  /** @type {boolean} 日本語の入力中はtureが入ります。 */
  typingJapanese = false;

  /**
   * キャレットを対象としたイベントリスナーを実装します。
   */
  addEventListenersIntoCaret = () => {

    // 押されたキーに合わせた処理を実行します。
    // 文字の入力・削除のみならず、選択範囲の操作もここで行われます。
    this.caret.addEventListener("keydown", (event) => {
      if (event.key === "Control") {
        this.ctrlKeyPressed = true;
        return;
      }
      if (event.key === "Shift") {
        this.shiftKeyPressed = true;
        return;
      }
      if (event.key === "Process") {
        this.typingJapanese = true;
        if (this.selectedRange.length !== 0) {
          this.removeCharactersInSelectedRange();
        }
        return;
      }
      this.reflectKeyCodeIntoTextArea(event.key);
      this.checkNeedToAutoScroll();
    });

    // 日本語入力処理に特化したイベントリスナーです。
    this.caret.addEventListener("input", (event) => {
      if (this.typingJapanese) {
        if (event.data === this.stockedJapaneseCharacters) {
          this.reflectKeyCodeIntoTextArea(this.stockedJapaneseCharacters);
          this.checkNeedToAutoScroll();
        }
        this.stockedJapaneseCharacters = event.data;
      }
    });

    // キーのフラグ解除くらいしかやることはありません。
    this.caret.addEventListener("keyup", (event) => {
      if (event.key === "Control") {
        this.ctrlKeyPressed = false;
        return;
      }
      if (event.key === "Shift") {
        this.shiftKeyPressed = false;
        return;
      }
      if (event.key === "Process") {
        this.typingJapanese = false;
        return;
      }
    });
  };

  /**
   * エディター本体を対象としたイベントリスナーを実装します。
   */
  addEventListenersIntoEditor = () => {

    // エディターの大きさが変わったときはスクロール制御処理に飛びます。
    const resizeObserver = new ResizeObserver(() => {
      this.resizeEditor();
    });
    resizeObserver.observe(this.root);

    // スクロールバーを動かし、それと行番号領域・文字領域を連動させます。
    // 何故スクロールバー上ではなく、エディター全体を対象としているかというと、
    // 細長いスクロールバー上だけでは操作性が悪いためです。
    this.root.addEventListener("mousemove", (event) => {
      if (this.draggingHorizontalScrollbar !== null) {

        // まずは最後に検知した位置より何ピクセル分スクロールしたかを求めます。
        const lastDraggingX = this.draggingHorizontalScrollbar;
        const currentDraggingX = event.pageX - this.root.getBoundingClientRect().left - pageXOffset;
        this.draggingHorizontalScrollbar = currentDraggingX;
        const scrollToEditorRight = currentDraggingX - lastDraggingX;

        // スクロールバー上の1ピクセルのスクロールが文字領域の何ピクセルに相当するかを求めます。
        const pxWhichIsEquivalentTo1pxOfArea = this.textArea.scrollWidth / this.textArea.clientWidth;

        // スクロール処理を実行するとともにスクロールバーの位置を動かします。
        this.scrollEditorHorizontally(pxWhichIsEquivalentTo1pxOfArea * scrollToEditorRight);

        return;
      }
      if (this.draggingScrollbar !== null) {

        // まずは最後に検知した位置より何ピクセル分スクロールしたかを求めます。
        const lastDraggingY = this.draggingScrollbar;
        const currentDraggingY = event.pageY - this.root.getBoundingClientRect().top - pageYOffset;
        this.draggingScrollbar = currentDraggingY;
        const scrollToEditorBottom = currentDraggingY - lastDraggingY;

        // スクロールバー上の1ピクセルのスクロールが行番号領域と文字領域の何ピクセルに相当するかを求めます。
        const pxWhichIsEquivalentTo1pxOfArea = this.textArea.scrollHeight / this.textArea.clientHeight;

        // スクロール処理を実行するとともにスクロールバーの位置を動かします。
        this.scrollEditorVertically(pxWhichIsEquivalentTo1pxOfArea * scrollToEditorBottom);

        return;
      }
    });

    // マウスホイールが操作されたときはスクロール処理を実行します。
    this.root.addEventListener("wheel", this.checkWheelEventTriggered);
  };

  /**
   * 水平方向のスクロールバーを対象としたイベントリスナーを実装します。
   */
  addEventListenersIntoHorizontalScrollbar = () => {

    // スクロールバーのドラッグ移動フラグを起動させます。
    // フラグはクリック開始座標を兼ねています。
    this.horizontalScrollbar.addEventListener("mousedown", (event) => {
      this.draggingHorizontalScrollbar = event.pageX - this.root.getBoundingClientRect().left - pageXOffset;
    });
  };

  /**
   * 水平方向のスクロールバー領域を対象としたイベントリスナーを実装します。
   */
  addEventListenersIntoHorizontalScrollbarArea = () => {

    // 領域の余白をクリックしたときにスクロール処理を実行します。
    this.horizontalScrollbarArea.addEventListener("mousedown", (event) => {
      if (this.horizontalScrollbar.classList.contains("tom-editor__horizontal-scrollbar-area--non-active")) {
        return;
      }
      if (event.offsetX < parseInt(this.horizontalScrollbar.style.left)) {
        this.scrollEditorHorizontally("wheel-scroll-up");
        return;
      }
      this.scrollEditorHorizontally("wheel-scroll-down");
    });
  };

  /**
   * 行番号領域を対象としたイベントリスナーを実装します。
   */
  addEventListenersIntoLineNumberArea = () => {

    // 行範囲選択とキャレットの移動を行います。
    this.lineNumberArea.addEventListener("mousedown", (event) => {
      if (event.target === this.negativeSpaceInLineNumberArea) {
        this.placeCaret(this.textArea.lastElementChild.lastElementChild);
        return;
      }
      if (event.target.classList.contains("tom-editor__line-number")) {
        for (let i = 0; i < this.lineNumberArea.childElementCount - 1; i += 1) {
          if (event.target === this.lineNumberArea.children[i]) {
            this.shiftKeyPressed = true;
            this.placeCaret(this.textArea.children[i].firstElementChild);
            this.updateSelectedRangeByArrowDown();
            this.shiftKeyPressed = false;
            return;
          }
        }
      }
    });
  };

  /**
   * スクロールバーを対象としたイベントリスナーを実装します。
   */
  addEventListenersIntoScrollbar = () => {

    // スクロールバーのドラッグ移動フラグを起動させます。
    // フラグはクリック開始座標を兼ねています。
    this.scrollbar.addEventListener("mousedown", (event) => {
      this.draggingScrollbar = event.pageY - this.root.getBoundingClientRect().top - pageYOffset;
    });
  };

  /**
   * スクロールバー領域を対象としたイベントリスナーを実装します。
   */
  addEventListenersIntoScrollbarArea = () => {

    // 領域の余白をクリックしたときにスクロール処理を実行します。
    this.scrollbarArea.addEventListener("mousedown", (event) => {
      if (this.scrollbar.classList.contains("tom-editor__scrollbar--non-active")) {
        return;
      }
      if (event.offsetY < parseInt(this.scrollbar.style.top)) {
        this.scrollEditorVertically("wheel-scroll-up");
        return;
      }
      this.scrollEditorVertically("wheel-scroll-down");
    });
  };

  /**
   * 文字領域を対象としたイベントリスナーを実装します。
   */
  addEventListenersIntoTextArea = () => {

    // クリックした場所にキャレットを配置します。
    // また、Shiftキーが押されていない状態のときは選択範囲の解除も行います。
    this.textArea.addEventListener("mousedown", (event) => {
      this.draggingTextArea = true;
      if (!(this.shiftKeyPressed)) {
        this.resetSelectedRange();
      }
      this.placeCaret(event.target);
      this.checkNeedToAutoScroll();
    });

    // ドラッグ中ならば範囲選択処理を行います。
    this.textArea.addEventListener("mousemove", (event) => {
      if (this.draggingTextArea && this.root.contains(this.caret)) {
        this.updateSelectedRangeByMouse(event.target);
        this.checkNeedToAutoScroll();
      }
    });
  };

  /**
   * Windowオブジェクトを対象としたイベントリスナーを実装します。
   */
  addEventListenersIntoWindow = () => {

    // ウィンドウからフォーカスが外れたときは範囲選択とキャレットを解除します。
    window.addEventListener("blur", () => {
      this.resetSelectedRange();
      this.blurCaret();
    });

    // mouseupイベントで行うのはドラッグフラグの解除くらいです。
    window.addEventListener("mouseup", () => {
      this.draggingHorizontalScrollbar = null;
      this.draggingScrollbar = null;
      this.draggingTextArea = false;
    });
  };

  /**
   * キャレットをDOM上から除外します。
   */
  blurCaret = () => {
    if (!(document.body.contains(this.caret))) {
      return;
    }
    this.caret.remove();
    this.focusedLineNumber.classList.remove("tom-editor__line-number--focus");
    this.focusedLineNumber = undefined;
    this.focusedTextLine.classList.remove("tom-editor__text-line--focus");
    this.focusedTextLine = undefined;
    this.focusedCharacter.classList.remove("tom-editor__character--focus");
    this.focusedCharacter = undefined;
  };

  /**
   * 矢印キーやマウスのホイール操作以外の状況で自動的にスクロールする必要があるか判定します。
   * 必要がある場合はどの方向にどれだけスクロールする必要があるかも算出します。
   */
  checkNeedToAutoScroll = () => {
    this.checkNeedToAutoVerticalScroll();
    this.checkNeedToAutoHorizontalScroll();
  };

  /**
   * 水平方向の自動スクロール判定処理です。
   */
  checkNeedToAutoHorizontalScroll = () => {

    // 文字領域の横幅がビューポートに収まっているならば早々に処理から抜けます。
    if (!(this.textArea.clientWidth < this.textArea.scrollWidth)) {
      this.horizontalScrollbarArea.classList.add("tom-editor__horizontal-scrollbar-area--non-active");
      return;
    }

    if (this.horizontalScrollbarArea.classList.contains("tom-editor__horizontal-scrollbar-area--non-active")) {
      this.horizontalScrollbarArea.classList.remove("tom-editor__horizontal-scrollbar-area--non-active");
    }

    // キャレットの位置に応じて自動的にスクロールするかどうかを判定します。
    const coordinateXFocusedCharacter = this.focusedCharacter.getBoundingClientRect().x;
    const coordinateXTextArea = this.textArea.getBoundingClientRect().x;

    // ビューポートの左外にキャレットが隠れているときの処理です。
    if (coordinateXFocusedCharacter < coordinateXTextArea) {
      this.scrollEditorHorizontally(coordinateXFocusedCharacter - coordinateXTextArea);
      return;
    }

    // ビューポートの右外にキャレットが隠れているときの処理です。
    const fontSize = parseInt(getComputedStyle(this.root).fontSize);
    if (coordinateXFocusedCharacter > coordinateXTextArea + this.textArea.clientWidth - fontSize) {
      this.scrollEditorHorizontally(coordinateXFocusedCharacter - (coordinateXTextArea + this.textArea.clientWidth - fontSize));
      return;
    }

    this.scrollEditorHorizontally();
  };

  /**
   * 垂直方向の自動スクロール判定処理です。
   */
  checkNeedToAutoVerticalScroll = () => {

    // フォーカスされた行番号の座標が処理の判定に役立ちます。
    // 座標はビューポート上縁に対して縦方向に何ピクセルずれているかを表しています。
    // 「0」ならば上縁ぴったり、負の値ならば上に隠れており、正の値はその逆です。
    const coordinateYOfFocusedLineNumber = this.focusedLineNumber.getBoundingClientRect().y;

    const coordinateYOfFocusedTextLine = this.focusedTextLine.getBoundingClientRect().y;
    const textLineHeight = this.focusedTextLine.getBoundingClientRect().height;

    // ビューポートの上外にキャレットが隠れているときの処理です。
    if (coordinateYOfFocusedLineNumber < textLineHeight * 1) {
      this.scrollEditorVertically([
        coordinateYOfFocusedLineNumber - textLineHeight - textLineHeight * 0.5,
        coordinateYOfFocusedTextLine - textLineHeight - textLineHeight * 0.5
      ]);
      return;
    }

    // ビューポート下外にキャレットが隠れているときの処理です。
    const textAreaHeight = this.textArea.getBoundingClientRect().height;
    if (coordinateYOfFocusedLineNumber > textAreaHeight - textLineHeight * 2) {
      this.scrollEditorVertically([
        coordinateYOfFocusedLineNumber - textAreaHeight + textLineHeight * 1.5,
        coordinateYOfFocusedTextLine - textAreaHeight + textLineHeight * 1.5
      ]);
      return;
    }

    this.scrollEditorVertically();
  };

  /**
   * ホイールイベントが起動したかどうかを確認します。
   * @param {object} event Element.
   */
  checkWheelEventTriggered = (event) => {

    // ホイールが時計・反時計、どちらの方向に回されたのかを特定します。
    let eventName
    if (Math.sign(event.deltaY) === -1) {
      eventName = "wheel-scroll-up";
    } else if (Math.sign(event.deltaY) === 1) {
      eventName = "wheel-scroll-down";
    } else {
      return;
    }

    // どのHTML要素上で実行されたかを特定し、処理を分岐します。
    if (event.target === this.horizontalScrollbarArea || event.target === this.horizontalScrollbar) {
      this.scrollEditorHorizontally(eventName);
      return;
    }
    this.scrollEditorVertically(eventName);
  };

  /**
   * 範囲選択されたHTML要素を文字列に変換します。
   * @param {boolean} cutFlag 変換時に範囲選択した範囲を削除するかどうかのフラグです。
   * @returns {string} 文字列化した範囲選択された値です。
   */
  convertSelectedRangeIntoText = (cutFlag) => {
    let offset = 0;
    if (cutFlag) {
      if (this.focusedCharacter === this.selectedRange[0]) {
        offset = -1;
      } else {
        offset = 1;
      }
    }
    let text = "";
    for (const character of this.selectedRange) {
      if (offset === -1) {
        this.inputDelete();
      } else if (offset === 1) {
        this.inputBackspace();
      }
      if (character.classList.contains("tom-editor__character--eol")) {
        text += "\n";
      } else {
        text += character.innerText;
      }
    }
    return text;
  };

  /**
   * 文字を表すHTML要素を作成します。
   * @param {string} innerCharacter HTML要素に入れる文字です。
   */
  createCharacter = (innerCharacter) => {
    const character = document.createElement("span");
    character.classList.add("tom-editor__character");
    character.innerHTML = innerCharacter;
    return character;
  };

  /**
   * 行末を表す特殊な文字を表すHTML要素を作成します。
   * @returns {Element} 行末を表す文字です。
   */
  createEOL = () => {
    const eol = document.createElement("span");
    eol.classList.add("tom-editor__character");
    eol.classList.add("tom-editor__character--eol");
    return eol;
  };

  /**
   * 行番号を表すHTML要素を作成します。
   * @param {number} lineNumber HTML要素に含める行番号です。
   */
  createLineNumber = (lineNumber) => {
    const lineNumberElement = document.createElement("div");
    lineNumberElement.classList.add("tom-editor__line-number");
    lineNumberElement.innerHTML = lineNumber;
    return lineNumberElement;
  };

  /**
   * 行を表すHTML要素を作成します。
   * @returns {Element} 行です。
   */
  createTextLine = () => {
    const textLine = document.createElement("div");
    textLine.classList.add("tom-editor__text-line");
    return textLine;
  };

  /**
   * フォーカス中の文字が、フォーカスしている文字列のなかで何文字目であるかを調べて返します。
   * @returns {number} インデックス値を返します。
   */
  getFocusedCharacterIndex = () => {
    for (let i = 0; i < this.focusedTextLine.children.length; i += 1) {
      if (this.focusedTextLine.children[i] === this.focusedCharacter) {
        return i;
      }
    }
  };

  /**
   * フォーカスしているのが何行目であるかを調べて返します。
   * @returns {number} インデックス値を返します。
   */
  getFocusedTextLineIndex = () => {
    for (let i = 0; i < this.textArea.children.length; i += 1) {
      if (this.textArea.children[i] === this.focusedTextLine) {
        return i;
      }
    }
  };

  /**
   * キャレットを初期化します。
   */
  initializeCaret = () => {
    this.caret = document.createElement("textarea");
    this.caret.spellcheck = false;
    this.caret.classList.add("tom-editor__caret");
  };

  /**
   * 水平方向のスクロールバー領域を初期化します。
   */
  initializeHorizontalScrollbarArea = () => {

    // 領域を初期化します。
    this.horizontalScrollbarArea = document.createElement("div");
    this.horizontalScrollbarArea.classList.add("tom-editor__horizontal-scrollbar-area");
    this.horizontalScrollbarArea.classList.add("tom-editor__horizontal-scrollbar-area--non-active");
    this.root.appendChild(this.horizontalScrollbarArea);

    // スクロールバーを初期化します。
    this.horizontalScrollbar = document.createElement("div");
    this.horizontalScrollbar.classList.add("tom-editor__horizontal-scrollbar");
    this.horizontalScrollbarArea.appendChild(this.horizontalScrollbar);
  };

  /**
   * 行番号領域を初期化します。
   */
  initializeLineNumberArea = () => {

    // 領域を初期化します。
    this.lineNumberArea = document.createElement("div");
    this.lineNumberArea.classList.add("tom-editor__line-number-area");
    this.root.appendChild(this.lineNumberArea);

    // 1行目を表すHTML要素を生成します。
    const newLineNumber = this.createLineNumber(1);
    this.lineNumberArea.appendChild(newLineNumber);

    // 領域下部に余白となるHTML要素を生成します。
    this.negativeSpaceInLineNumberArea = document.createElement("div");
    this.negativeSpaceInLineNumberArea.classList.add("tom-editor__negative-space-in-line-number-area");
    this.setStyle(this.negativeSpaceInLineNumberArea);
    this.lineNumberArea.appendChild(this.negativeSpaceInLineNumberArea);
  };

  /**
   * エディターを構成するHTML要素のうち、最上位のHTML要素を初期化します。
   * @param {Element} tomEditorContainer エディターを実装する最上位のHTML要素です。
   */
  initializeRootElement = (tomEditorContainer) => {
    this.root = tomEditorContainer;
    this.root.classList.add("tom-editor");
  };

  /**
   * 縦方向のスクロールバー領域を初期化します。
   */
  initializeScrollbarArea = () => {

    // 領域を初期化します。
    this.scrollbarArea = document.createElement("div");
    this.scrollbarArea.classList.add("tom-editor__scrollbar-area");
    this.root.appendChild(this.scrollbarArea);

    // スクロールバーを初期化します。
    this.scrollbar = document.createElement("div");
    this.scrollbar.classList.add("tom-editor__scrollbar");
    this.scrollbar.classList.add("tom-editor__scrollbar--non-active");
    this.scrollbarArea.appendChild(this.scrollbar);
  };

  /**
   * 入力された文字を表示する領域を初期化します。
   */
  initializeTextArea = () => {

    // 領域を初期化します。
    this.textArea = document.createElement("div");
    this.textArea.classList.add("tom-editor__text-area");
    this.root.appendChild(this.textArea);

    // 領域に1行目を表すHTML要素を実装します。
    const textLine1 = this.createTextLine();
    this.textArea.appendChild(textLine1);

    // 1行目の1文字目に行末を表すメタ文字を実装します。
    const eol = this.createEOL();
    textLine1.appendChild(eol);

    // スクロール制御のために必要な余白を実装します。
    this.negativeSpaceInTextArea = document.createElement("div");
    this.negativeSpaceInTextArea.classList.add("tom-editor__negative-space-in-text-area");
    this.setStyle(this.negativeSpaceInTextArea);
    this.textArea.appendChild(this.negativeSpaceInTextArea);
  };

  /**
   * 下矢印キーの入力処理です。
   */
  inputArrowDown = () => {

    // Shiftキーが押されておらず、かつ範囲選択がされているときは範囲選択を解除します。
    // ただし、ドラッグ中は例外です。
    if (!(this.draggingTextArea)) {
      if (!(this.shiftKeyPressed) && this.selectedRange.length !== 0) {
        this.resetSelectedRange();
      }
    }

    // キャレットの下に文がない場合は、キャレット配置行の末尾に移動します。
    const nextTextLine = this.focusedTextLine.nextElementSibling;
    if (this.focusedTextLine.nextElementSibling === this.negativeSpaceInTextArea) {
      this.placeCaret(this.focusedTextLine.lastElementChild);
      return;
    }

    // キャレットの下に文がある場合は、当該行の同じ列に移動します。
    const focusedCharacterIndex = this.getFocusedCharacterIndex();
    if (typeof nextTextLine.children[focusedCharacterIndex] === "undefined") {
      this.placeCaret(nextTextLine.lastElementChild);
      return;
    }

    // 同じ列がない場合は末尾に移動させます。
    this.placeCaret(nextTextLine.children[focusedCharacterIndex]);
  };

  /**
   * 左矢印キーの入力処理です。
   */
  inputArrowLeft = () => {

    // Shiftキーが押されておらず、かつ範囲選択がされているときは範囲選択を解除します。
    // ただし、ドラッグ中は例外です。
    if (!(this.draggingTextArea)) {
      if (!(this.shiftKeyPressed) && this.selectedRange.length !== 0) {
        this.resetSelectedRange();
      }
    }

    // フォーカス中の文字の直前に文字があるならば、そちらにキャレットを移します。
    const previousFocusedCharacter = this.focusedCharacter.previousElementSibling;
    if (previousFocusedCharacter !== null) {
      if (typeof this.selectedRange === "undefined") {
        this.selectedRange = this.focusedCharacter;
      }

      this.placeCaret(previousFocusedCharacter);
      return;
    }

    // フォーカスしている行の直前に行があるならば、当該行の末尾の文字にキャレットを移します。
    const previousFocusedTextLine = this.focusedTextLine.previousElementSibling;
    if (previousFocusedTextLine !== null) {
      this.placeCaret(previousFocusedTextLine.lastElementChild);
    }
  };

  /**
   * 右矢印キーの入力処理です。
   */
  inputArrowRight = () => {

    // CtrlキーかShiftキーが押されておらず、かつ範囲選択がされているときは範囲選択を解除します。
    // ただし、ドラッグ中は例外です。
    if (!(this.ctrlKeyPressed)) {
      if (!(this.draggingTextArea)) {
        if (!(this.shiftKeyPressed) && this.selectedRange.length !== 0) {
          this.resetSelectedRange();
        }
      }
    }

    // フォーカス中の文字の直後に文字があるならば、そちらにキャレットを移します。
    const nextFocusedCharacter = this.focusedCharacter.nextElementSibling;
    if (nextFocusedCharacter !== null) {
      this.placeCaret(nextFocusedCharacter);
      return;
    }

    // フォーカスしているのは行末だが、次行があるならば当該行の先頭の文字にキャレットを移します。
    const nextFocusedTextLine = this.focusedTextLine.nextElementSibling;
    if (!(nextFocusedTextLine === this.negativeSpaceInTextArea)) {
      this.placeCaret(nextFocusedTextLine.firstElementChild);
    }
  };

  /**
   * 上矢印キーの入力処理です。
   */
  inputArrowUp = () => {

    // Shiftキーが押されておらず、かつ範囲選択がされているときは範囲選択を解除します。
    // ただし、ドラッグ中は例外です。
    if (!(this.draggingTextArea)) {
      if (!(this.shiftKeyPressed) && this.selectedRange.length !== 0) {
        this.resetSelectedRange();
      }
    }

    // キャレットの上に文がない場合は、キャレット配置行の先頭に移動します。
    const previousTextLine = this.focusedTextLine.previousElementSibling;
    if (previousTextLine === null) {
      this.placeCaret(this.focusedTextLine.firstElementChild);
      return;
    }

    // キャレットの上に文がある場合は、当該行の同じ列に移動します。
    const focusedCharacterIndex = this.getFocusedCharacterIndex();
    if (typeof previousTextLine.children[focusedCharacterIndex] === "undefined") {
      this.placeCaret(previousTextLine.lastElementChild);
      return;
    }

    // 同じ列がない場合は末尾に移動させます。
    this.placeCaret(previousTextLine.children[focusedCharacterIndex]);
  };

  /**
   * 半角英数字の入力処理です。
   * @param {string} keyCode 入力する文字です。
   */
  inputASCIICharacter = (keyCode) => {
    if (this.selectedRange.length !== 0) {
      this.removeCharactersInSelectedRange();
    }
    const newCharacter = this.createCharacter(keyCode);
    this.focusedCharacter.before(newCharacter);
    this.placeCaret(this.focusedCharacter);
    this.saveHistory();
  };

  /**
   * Backspaceキーの入力処理です。
   */
  inputBackspace = () => {

    // 現在フォーカスしているのが文中ならば普通に文字削除処理を実行します。
    if (this.focusedCharacter.previousElementSibling !== null) {
      this.focusedCharacter.previousElementSibling.remove();
      this.placeCaret(this.focusedCharacter);
      this.saveHistory();
      return;
    }

    const previousTextLine = this.focusedTextLine.previousElementSibling;

    // 行頭、かつ1行目である場合は何もすることがないので処理から抜けます。
    if (previousTextLine === null) {
      return;
    }

    // 2行目以降の行頭にフォーカスしていることが分かりましたので専用の処理を実行します。
    // まずは移動先、つまりフォーカスしている行の1つ上の行にある行末文字を削除します。
    previousTextLine.lastElementChild.remove();

    // フォーカスしている行の文字を1つ上の行に移動させます。
    const numberOfCharacters = previousTextLine.children.length;
    for (let i = 0; i < numberOfCharacters; i += 1) {
      this.focusedTextLine.prepend(previousTextLine.lastElementChild);
    }

    // 空になった行を削除します。
    previousTextLine.remove();

    // 行番号も1つ減らします。
    this.removeLineNumber();

    this.placeCaret(this.focusedCharacter);
    this.saveHistory();
  };

  /**
   * Deleteキーの入力処理です。
   */
  inputDelete = () => {

    // 現在フォーカスしているのが行末であるならば分岐します。
    if (this.focusedCharacter.classList.contains("tom-editor__character--eol")) {
      const nextFocusedTextLine = this.focusedTextLine.nextElementSibling;

      // 行末、かつ次行がない場合は文末であると判断して何もせずに処理から抜けます。
      if (nextFocusedTextLine === this.negativeSpaceInTextArea) {
        return;
      }

      // 行末、かつ次行がある場合は次行を削除して次行の内容をキャレットの後ろに持ってきます。
      const numberOfCharacters = nextFocusedTextLine.children.length;
      for (let i = 0; i < numberOfCharacters; i += 1) {
        this.focusedTextLine.appendChild(nextFocusedTextLine.firstElementChild);
      }
      nextFocusedTextLine.remove();
      this.removeLineNumber();

      // このままだと1行にEOFが2つ存在してしまうためフォーカスしている行の行末文字を削除します。
      // その後、同インデックスにある行末文字にフォーカスを移します。
      const focusedCharacterIndex = this.getFocusedCharacterIndex();
      this.focusedCharacter.remove();
      this.placeCaret(this.focusedTextLine.children[focusedCharacterIndex]);
      this.saveHistory();
      return;
    }

    // 行末ではなかったので普通に削除します。
    const currentFocusedCharacter = this.focusedCharacter;
    this.placeCaret(currentFocusedCharacter.nextElementSibling);
    currentFocusedCharacter.remove();
    this.saveHistory();
  };

  /**
   * Enterキーの入力処理です。
   */
  inputEnter = () => {
    if (this.selectedRange.length !== 0) {
      this.removeCharactersInSelectedRange();
    }

    // あらかじめ空行を新規行を生成しておきます。
    const newTextLine = document.createElement("div");
    newTextLine.classList.add("tom-editor__text-line");

    // 新規行に挿入する文字を現在フォーカスしている行から抽出します。
    // 抽出した文字列の末尾には行末文字を足します。
    while (true) {
      if (
        this.focusedCharacter.nextElementSibling === null ||
        this.focusedCharacter.nextElementSibling.classList.contains("tom-editor__character--eol")
      ) {
        break;
      }
      newTextLine.appendChild(this.focusedCharacter.nextElementSibling);
    }
    if (!(this.focusedCharacter.classList.contains("tom-editor__character--eol"))) {
      newTextLine.prepend(this.focusedCharacter);
    }
    newTextLine.appendChild(this.createEOL());

    // DOMに挿入します。
    this.focusedTextLine.after(newTextLine);

    // 行番号領域の行制御を行います。
    // 新規行番号の生成・挿入は必ず行いますが、次行が存在するかどうかで処理が少し異なります。
    if (this.focusedLineNumber.nextElementSibling === this.negativeSpaceInLineNumberArea) {
      const newLineNumber = this.createLineNumber(Number(this.focusedLineNumber.innerHTML) + 1);
      this.focusedLineNumber.after(newLineNumber);
    } else {
      const newLineNumber = this.createLineNumber(Number(this.lineNumberArea.children.length));
      this.negativeSpaceInLineNumberArea.before(newLineNumber);
    }

    // 新規行の1文字目にキャレットを合わせます。
    this.placeCaret(newTextLine.firstElementChild);

    this.saveHistory();
  };

  /**
   * 日本語入力を行います。
   */
  inputJapaneseCharacters = () => {
    for (const character of this.stockedJapaneseCharacters) {
      const newCharacter = this.createCharacter(character);
      this.focusedCharacter.before(newCharacter);
      this.placeCaret(this.focusedCharacter);
    }
    this.stockedJapaneseCharacters = "";
    this.saveHistory();
  };

  /**
   * 引数で受け取った場所に応じてキャレットを配置します。
   * @param {Element} clickedElement クリックされた対象です。
   */
  placeCaret = (clickedElement) => {

    // 既にフォーカスされていた場合はフォーカス用スタイルを外しておきます。
    // なお、この時点でフォーカス対象となるHTML要素をプロパティから削除してはいけません。
    // キャレットであるtextareaタグをクリックしたときに挙動がおかしくなるためです。
    if (typeof this.focusedLineNumber !== "undefined") {
      this.focusedLineNumber.classList.remove("tom-editor__line-number--focus");
    }
    if (typeof this.focusedTextLine !== "undefined") {
      this.focusedTextLine.classList.remove("tom-editor__text-line--focus");
    }
    if (typeof this.focusedCharacter !== "undefined") {
      this.focusedCharacter.classList.remove("tom-editor__character--focus");
    }

    // クリックされたのが文字領域（余白）か行か文字なのかで配置する場所を特定します。
    if (clickedElement === this.negativeSpaceInTextArea) {
      this.focusedTextLine = this.negativeSpaceInTextArea.previousElementSibling;
      this.focusedCharacter = this.focusedTextLine.lastElementChild;
      this.focusedLineNumber = this.negativeSpaceInLineNumberArea.previousElementSibling;
    } else if (clickedElement.classList.contains("tom-editor__text-line")) {
      this.focusedTextLine = clickedElement;
      this.focusedCharacter = this.focusedTextLine.lastElementChild;
      this.focusedLineNumber = this.lineNumberArea.children[this.getFocusedTextLineIndex()];
    } else if (clickedElement.classList.contains("tom-editor__character")) {
      this.focusedTextLine = clickedElement.parentElement;
      this.focusedCharacter = clickedElement;
      this.focusedLineNumber = this.lineNumberArea.children[this.getFocusedTextLineIndex()];
    } else {

      // クリックされたのが領域・行・文字ではないとすればキャレットであると見なします。
      // 基本的にキャレットがクリックされることはないのですが稀にあります。
      // そのときは特に何もせずに離脱します。
      return;
    }

    // キャレットを配置する行と文字、そして行番号にフォーカス時専用のスタイルを付与します。
    this.focusedLineNumber.classList.add("tom-editor__line-number--focus");
    this.focusedTextLine.classList.add("tom-editor__text-line--focus");
    this.focusedCharacter.classList.add("tom-editor__character--focus");

    // フォーカスされた文字にキャレットを重ねます。
    this.focusedCharacter.appendChild(this.caret);
    setTimeout(() => {
      this.caret.focus();
    });
  };

  /**
   * 履歴に格納されていた状態を現在のエディターに反映させます。
   */
  reflectHistoryIntoEditor = () => {

    // 行番号領域を更新します。
    this.lineNumberArea.innerHTML = this.historyOfLineNumberArea[this.currentHistoryIndex];
    this.focusedLineNumber = this.lineNumberArea.querySelector(".tom-editor__line-number--focus");
    if (this.focusedLineNumber === null) {
      this.focusedLineNumber = undefined;
    }
    this.negativeSpaceInLineNumberArea = this.lineNumberArea.querySelector(".tom-editor__negative-space-in-line-number-area");

    // 文字領域を更新します。
    this.textArea.innerHTML = this.historyOfTextArea[this.currentHistoryIndex];
    this.focusedTextLine = this.textArea.querySelector(".tom-editor__text-line--focus");
    if (this.focusedTextLine === null) {
      this.focusedTextLine = undefined;
    }
    this.focusedCharacter = this.textArea.querySelector(".tom-editor__character--focus");
    if (this.focusedCharacter === null) {
      this.focusedCharacter = undefined;
    }
    this.negativeSpaceInTextArea = this.textArea.querySelector(".tom-editor__negative-space-in-text-area");

    // キャレットを更新します。
    this.caret = this.textArea.querySelector(".tom-editor__caret");
    if (this.caret === null) {
      this.initializeCaret();
    }
    this.addEventListenersIntoCaret();

    // 新たにフォーカスします。
    if (typeof this.focusedCharacter !== "undefined") {
      this.placeCaret(this.focusedCharacter);
      return;
    }
    if (typeof this.focusedTextLine !== "undefined") {
      this.placeCaret(this.focusedTextLine);
      return;
    }
    this.placeCaret(this.negativeSpaceInTextArea);
  };

  /**
   * 入力されたキーコードに対応した処理を実行します。
   * @param {string} keyCode 入力されたキーコードです。
   */
  reflectKeyCodeIntoTextArea = (keyCode) => {

    // Ctrlキーが押されているときの処理を最優先とします。
    if (this.ctrlKeyPressed) {
      for (const [condition, method] of [
        [keyCode === "a", this.shortcutByCtrlA],
        [keyCode === "c", this.shortcutByCtrlC],
        [keyCode === "v", this.shortcutByCtrlV],
        [keyCode === "x", this.shortcutByCtrlX],
        [keyCode === "y", this.shortcutByCtrlY],
        [keyCode === "z", this.shortcutByCtrlZ]
      ]) {
        if (condition) {
          method();
          return;
        }
      }

      // Ctrlキーが押されているときはショートカット処理以外は走らせないようにします。
      return;
    }

    if (keyCode.length === 1) {
      this.inputASCIICharacter(keyCode);
      return;
    }
    for (const [condition, method] of [
      [keyCode === this.stockedJapaneseCharacters, this.inputJapaneseCharacters],
      [this.shiftKeyPressed && keyCode === "ArrowDown", this.updateSelectedRangeByArrowDown],
      [this.shiftKeyPressed && keyCode === "ArrowLeft", this.updateSelectedRangeByArrowLeft],
      [this.shiftKeyPressed && keyCode === "ArrowRight", this.updateSelectedRangeByArrowRight],
      [this.shiftKeyPressed && keyCode === "ArrowUp", this.updateSelectedRangeByArrowUp],
      [this.selectedRange.length !== 0 && keyCode === "Backspace", this.removeCharactersInSelectedRange],
      [this.selectedRange.length !== 0 && keyCode === "Delete", this.removeCharactersInSelectedRange],
      [keyCode === "ArrowDown", this.inputArrowDown],
      [keyCode === "ArrowLeft", this.inputArrowLeft],
      [keyCode === "ArrowRight", this.inputArrowRight],
      [keyCode === "ArrowUp", this.inputArrowUp],
      [keyCode === "Backspace", this.inputBackspace],
      [keyCode === "Delete", this.inputDelete],
      [keyCode === "Enter", this.inputEnter]
    ]) {
      if (condition) {
        method();
        return;
      }
    }
  };

  /**
   * 範囲選択されている文字を全て削除します。
   * 当然、範囲選択情報もリセットします。
   */
  removeCharactersInSelectedRange = () => {
    if (this.focusedCharacter === this.selectedRange[0]) {
      for (let i = 0; i < this.selectedRange.length; i += 1) {
        this.inputDelete();
      }
    } else {
      for (let i = 0; i < this.selectedRange.length; i += 1) {
        this.inputBackspace();
      }
    }
    this.resetSelectedRange();
  };

  /**
   * 行番号領域の行番号を1つ減らします。
   */
  removeLineNumber = () => {
    this.negativeSpaceInLineNumberArea.previousElementSibling.remove();
  };

  /**
   * 範囲選択情報をリセットします。
   */
  resetSelectedRange = () => {
    for (const character of this.selectedRange) {
      character.classList.remove("tom-editor__character--selected");
    }
    this.selectedRange = [];
    this.shiftKeyPressed = false;
  };

  /**
   * エディターの寸法を更新します。
   */
  resizeEditor = () => {
    this.setStyle(this.negativeSpaceInLineNumberArea);
    this.setStyle(this.negativeSpaceInTextArea);
  };

  /**
   * 現在の状態を保存します。
   * @param {string} option 挙動を制御するフラグです。
   */
  saveHistory = (option) => {

    // 初期化時だけは履歴のインデックス値を0に設定します。
    if (option === "initialize" || typeof this.currentHistoryIndex === "undefined") {
      this.currentHistoryIndex = 0;
    } else {
      this.currentHistoryIndex += 1;
    }

    // 新たに状態を保存します。
    this.historyOfLineNumberArea.push(this.lineNumberArea.innerHTML);
    this.historyOfTextArea.push(this.textArea.innerHTML);

    // 保存した状態が最新の記録となるように、この記録よりもインデックス値の大きい要素を全て削除します。
    const maximumHistoryIndex = this.currentHistoryIndex.length - 1;
    const numberOfRemoveTargets = maximumHistoryIndex - this.currentHistoryIndex;
    for (let i = 0; i < numberOfRemoveTargets; i += 1) {
      this.currentHistoryIndex.pop();
    }
  };

  /**
   * エディターの水平方向のスクロール処理を制御します。
   * @param {any} option 制御に関係する値です。
   */
  scrollEditorHorizontally = (option) => {

    // まずは文字領域のスクロール度合いを制御します。
    const textLineHeight = this.textArea.firstElementChild.getBoundingClientRect().height;
    if (option === "wheel-scroll-up") {
      this.textArea.scrollLeft -= textLineHeight * 3;
    } else if (option === "wheel-scroll-down") {
      this.textArea.scrollLeft += textLineHeight * 3;
    } else if (typeof option === "number") {
      this.textArea.scrollLeft += option
    }

    // スクロールバーの長さを求めます。
    const raitoOfTextAreaToText = this.textArea.clientWidth / this.textArea.scrollWidth;

    // スクロールバーの位置を求めます。
    const scrollRaitoOfTextArea = this.textArea.scrollLeft / (this.textArea.scrollWidth - this.textArea.clientWidth);

    this.setStyle(this.horizontalScrollbar, [raitoOfTextAreaToText, scrollRaitoOfTextArea]);
  };

  /**
   * エディターの垂直方向のスクロール処理を制御します。
   * @param {any} option 制御に関係する値です。
   */
  scrollEditorVertically = (option) => {

    // まずは行版領域と文字領域のスクロール度合いを制御します。
    const textLineHeight = this.textArea.firstElementChild.getBoundingClientRect().height;
    if (option === "wheel-scroll-up") {
      this.lineNumberArea.scrollTop -= textLineHeight * 3;
      this.textArea.scrollTop -= textLineHeight * 3;
    } else if (option === "wheel-scroll-down") {
      this.lineNumberArea.scrollTop += textLineHeight * 3;
      this.textArea.scrollTop += textLineHeight * 3;
    } else if (option instanceof Array) {
      this.lineNumberArea.scrollTop += option[0];
      this.textArea.scrollTop += option[1];
    } else if (typeof option === "number") {
      this.lineNumberArea.scrollTop += option;
      this.textArea.scrollTop += option;
    }

    // スクロールバーの長さとスクロールバー領域に対するスクロール度合いとスタイルを更新します。
    // 私はスクロールバーというものは「スクロール対象となる要素に対してのビューポート」であると捉えています。
    // つまり、「"ビューポートの寸法" / "文字領域の内容量の寸法"」でスクロールバーの長さが求められます。
    const textAreaHeight = this.textArea.getBoundingClientRect().height;
    const negativeSpaceHeight = this.negativeSpaceInTextArea.getBoundingClientRect().height;
    const textLinesTotalHeight = textLineHeight * (this.textArea.childElementCount - 1);
    const textAreaContentsHeight = negativeSpaceHeight + textLinesTotalHeight;
    const raitoOfTextAreaToText = textAreaHeight / textAreaContentsHeight;
    const textAreaScrollRaito = this.textArea.scrollTop / (this.textArea.scrollHeight - this.textArea.offsetHeight);
    this.setStyle(this.scrollbar, [raitoOfTextAreaToText, textAreaScrollRaito]);
    if (raitoOfTextAreaToText < 1) {
      if (this.scrollbar.classList.contains("tom-editor__scrollbar--non-active")) {
        this.scrollbar.classList.remove("tom-editor__scrollbar--non-active");
      }
    } else {
      this.scrollbar.classList.add("tom-editor__scrollbar--non-active");
    }
  };

  /**
   * ドラッグによる選択範囲処理に関する諸値をプロパティにセットします。
   * @param {Element} draggingStartCharacter ドラッグ開始地点となるHTML要素です。
   */
  setDraggingElementStatus = (draggingStartCharacter) => {
    this.draggingStartCharacter = draggingStartCharacter;
    this.draggingStartTextLine = this.draggingStartCharacter.parentNode;
    for (let i = 0; i < this.draggingStartTextLine.children.length; i += 1) {
      if (draggingStartCharacter === this.draggingStartTextLine.children[i]) {
        this.draggingStartCharacterIndex = i;
        break;
      }
    }
    for (let i = 0; i < this.textArea.children.length; i += 1) {
      if (this.draggingStartTextLine === this.textArea.children[i]) {
        this.draggingStartTextLineIndex = i;
        break;
      }
    }
  };

  /**
   * 引数で受け取ったHTML要素のスタイルを操作する特別なメソッドです。
   * 引数によって挙動を制御しています。
   * @param {Element} elementOfStyleApplication 操作対象です。
   * @param {any} option 操作対象によっては指定される値です。
   */
  setStyle = (elementOfStyleApplication, option) => {

    // 行番号領域余白の縦方向のサイズを調整します。
    if (elementOfStyleApplication === this.negativeSpaceInLineNumberArea) {
      const lineNumberAreaHeight = this.lineNumberArea.getBoundingClientRect().height;
      const lineNumberHeight = this.lineNumberArea.firstElementChild.getBoundingClientRect().height;
      this.negativeSpaceInLineNumberArea.style.height = lineNumberAreaHeight - lineNumberHeight + "px";
      return;
    }

    // 文字領域余白の縦方向のサイズを調整します。
    if (elementOfStyleApplication === this.negativeSpaceInTextArea) {
      const textAreaHeight = this.textArea.getBoundingClientRect().height;
      const textLineHeight = this.textArea.firstElementChild.getBoundingClientRect().height;
      this.negativeSpaceInTextArea.style.height = textAreaHeight - textLineHeight + "px";
      return;
    }

    // 垂直・水平スクロールバーの寸法とスクロール位置を調整します。
    if (elementOfStyleApplication === this.scrollbar || elementOfStyleApplication === this.horizontalScrollbar) {

      // 寸法を調整します。
      const size = new Intl.NumberFormat("ja", {
        maximumSignificantDigits: 4,
        style: "percent"
      }).format(option[0]);
      if (elementOfStyleApplication === this.scrollbar) {
        this.scrollbar.style.height = size;
      } else {
        this.horizontalScrollbar.style.width = size;
      }

      // スクロール位置を調整します。
      let scrollbarAreaSize;
      let scrollbarSize;
      if (elementOfStyleApplication === this.scrollbar) {
        scrollbarAreaSize = this.scrollbarArea.clientHeight;
        scrollbarSize = this.scrollbar.clientHeight;
      } else {
        scrollbarAreaSize = this.horizontalScrollbarArea.clientWidth;
        scrollbarSize = this.horizontalScrollbar.clientWidth;
      }
      const scrollBarAreaNegativeSpaceSize = scrollbarAreaSize - scrollbarSize;
      const scrollSize = scrollBarAreaNegativeSpaceSize * option[1];
      if (elementOfStyleApplication === this.scrollbar) {
        this.scrollbar.style.top = scrollSize + "px";
      } else {
        this.horizontalScrollbar.style.left = scrollSize + "px";
      }

      return;
    }

    throw new Error(elementOfStyleApplication);
  };

  /**
   * 全文を範囲選択します。
   * 実行後、キャレットは文末に移動します。
   */
  shortcutByCtrlA = () => {
    this.resetSelectedRange();
    this.placeCaret(this.textArea.firstElementChild.firstElementChild);
    while (true) {
      if (this.focusedCharacter.nextElementSibling === null && this.focusedTextLine.nextElementSibling === this.negativeSpaceInTextArea) {
        return;
      }
      this.updateSelectedRangeByArrowRight();
    }
  };

  /**
   * 範囲選択された文章をクリップボードにコピーします。
   */
  shortcutByCtrlC = () => {
    const text = this.convertSelectedRangeIntoText(false);
    navigator.clipboard.writeText(text);
  };

  /**
   * 範囲選択された文章をキャレットの位置に挿入します。
   */
  shortcutByCtrlV = () => {
    navigator.clipboard.readText().then((text) => {
      for (const character of text) {

        // Async Clipboard APIで改行を取得すると「\n」ではなく「\r」と「\n」の2文字で表現されます。
        // そのままDOMに突っ込むと2回改行されてしまうため「\r」は無視するようにします。
        if (character === "\r") {
          continue;
        }
        if (character === "\n") {
          this.inputEnter();
          continue;
        }
        this.inputASCIICharacter(character);
      }
    });
  };

  /**
   * 範囲選択された文章をクリップボードに移動します。
   */
  shortcutByCtrlX = () => {
    const text = this.convertSelectedRangeIntoText(true);
    navigator.clipboard.writeText(text);
  };

  /**
   * 入力内容を1つ未来の状態にします。
   */
  shortcutByCtrlY = () => {
    if (typeof this.historyOfLineNumberArea[this.currentHistoryIndex + 1] === "undefined") {
      return;
    }
    this.currentHistoryIndex += 1;
    this.reflectHistoryIntoEditor();
  };

  /**
   * 入力内容を1つ前の状態にします。
   */
  shortcutByCtrlZ = () => {
    if (typeof this.historyOfLineNumberArea[this.currentHistoryIndex - 1] === "undefined") {
      return;
    }
    this.currentHistoryIndex -= 1;
    this.reflectHistoryIntoEditor();
  };

  /**
   * 下矢印キーが入力されたときの選択範囲操作処理です。
   */
  updateSelectedRangeByArrowDown = () => {

    // 選択範囲に入る文字数を数え、その回数だけ右矢印キーを押したことにして選択範囲を更新します。
    let numberOfCharacters = 0;
    let targetCharacter = this.focusedCharacter;

    // まずはフォーカスしている行を対象として文字の抽出を行います。
    // この時点では行末文字は含めません。
    while (true) {
      if (targetCharacter.classList.contains("tom-editor__character--eol")) {
        break;
      }
      numberOfCharacters += 1;
      targetCharacter = targetCharacter.nextElementSibling;
    }

    // 次行があるならば、次行のフォーカスしている文字と同列までを選択範囲に含めます。
    if (!(this.focusedTextLine.nextElementSibling === this.negativeSpaceInTextArea)) {
      numberOfCharacters += 1;
      targetCharacter = this.focusedTextLine.nextElementSibling.firstElementChild;
      const focusedCharacterIndex = this.getFocusedCharacterIndex();
      for (let i = 0; i < focusedCharacterIndex; i += 1) {
        if (targetCharacter.classList.contains("tom-editor__character--eol")) {
          break;
        }
        numberOfCharacters += 1;
        targetCharacter = targetCharacter.nextElementSibling;
      }
    }
    for (let i = 0; i < numberOfCharacters; i += 1) {
      this.updateSelectedRangeByArrowRight();
    }
  };

  /**
   * 左矢印キーが入力されたときの選択範囲操作処理です。
   */
  updateSelectedRangeByArrowLeft = () => {
    if (this.focusedCharacter.previousElementSibling === null) {

      // 以下、キャレットが文頭、あるいは行頭にあるときの処理です。

      // キャレットが文頭にあるならば何もできないので処理から抜けます。
      if (this.focusedTextLine.previousElementSibling === null) {
        return;
      }

      // キャレットが行頭ならばフォーカスしている行の1つ上の行の末尾文字を選択範囲に含めます。
      const targetCharacter = this.focusedTextLine.previousElementSibling.lastElementChild;
      if (targetCharacter.classList.toggle("tom-editor__character--selected")) {
        this.selectedRange.unshift(targetCharacter);
      } else {
        this.selectedRange.pop();
      }
    } else {

      // キャレットが文中にあるときの処理です。
      const targetCharacter = this.focusedCharacter.previousElementSibling;
      if (targetCharacter.classList.toggle("tom-editor__character--selected")) {
        this.selectedRange.unshift(targetCharacter);
      } else {
        this.selectedRange.pop();
      }
    }
    this.inputArrowLeft();
  };

  /**
   * 右矢印キーが入力されたときの選択範囲操作処理です。
   */
  updateSelectedRangeByArrowRight = () => {

    // キャレットが文末ならば何もできることがないので処理から抜けます。
    if (this.focusedCharacter.nextElementSibling === null && this.focusedTextLine.nextElementSibling === this.negativeSpaceInTextArea) {
      return;
    }

    // キャレットが文中・行末にあるときの処理です。
    const targetCharacter = this.focusedCharacter;
    if (targetCharacter.classList.toggle("tom-editor__character--selected")) {
      this.selectedRange.push(targetCharacter);
    } else {
      this.selectedRange.shift();
    }
    this.inputArrowRight();
  };

  /**
   * 上矢印キーが入力されたときの選択範囲操作処理です。
   */
  updateSelectedRangeByArrowUp = () => {

    // 選択範囲に入る文字数を求め、その文字数だけ左矢印キーによる選択範囲操作処理を実行します。
    let numberOfCharacters = 0;

    // まずはフォーカスしている行を対象として文字数を求めます
    // 行頭方向への範囲選択ではキャレットの左側――フォーカスしている直前の文字が処理対象になりますので-1するのを忘れないようにします。
    const columnNumber = this.getFocusedCharacterIndex() + 1;
    numberOfCharacters += columnNumber - 1;

    // フォーカスしている行の上に行があるならば文字数を追加します。
    if (this.focusedTextLine.previousElementSibling !== null) {
      const previousFocusedTextLineLength = this.focusedTextLine.previousElementSibling.children.length;
      if (columnNumber < previousFocusedTextLineLength) {
        numberOfCharacters += previousFocusedTextLineLength - columnNumber;
      }
      numberOfCharacters += 1;
    }

    for (let i = 0; i < numberOfCharacters; i += 1) {
      this.updateSelectedRangeByArrowLeft();
    }
  };

  /**
   * マウスの左クリック押しっぱなしによる選択範囲操作処理です。
   * @param {Element} draggingElement 同操作で捕捉されたHTML要素です。
   */
  updateSelectedRangeByMouse = (draggingElement) => {

    // まずはドラッグしている対象からドラッグ先となる行・文字を特定します。
    let draggingTextLineIndex;
    let draggingCharacterIndex;
    if (draggingElement.classList.contains("tom-editor__text-area")) {
      draggingTextLineIndex = this.textArea.children.length - 1;
      draggingCharacterIndex = this.textArea.children[draggingTextLineIndex].children.length - 1;
    } else if (draggingElement.classList.contains("tom-editor__text-line")) {
      for (let i = 0; i < this.textArea.children.length; i += 1) {
        if (draggingElement === this.textArea.children[i]) {
          draggingTextLineIndex = i;
          break;
        }
      }
      draggingCharacterIndex = this.textArea.children[draggingTextLineIndex].children.length - 1;
    } else if (draggingElement.classList.contains("tom-editor__character")) {
      for (let i = 0; i < this.textArea.children.length; i += 1) {
        if (draggingElement.parentElement === this.textArea.children[i]) {
          draggingTextLineIndex = i;
          break;
        }
      }
      for (let i = 0; i < this.textArea.children[draggingTextLineIndex].children.length; i += 1) {
        if (draggingElement === this.textArea.children[draggingTextLineIndex].children[i]) {
          draggingCharacterIndex = i;
          break;
        }
      }
    } else {

      // キャレットに重なった場合はとりあえず抜けておきます。
      return;
    }

    // ドラッグしている行へ移動します。
    // フォーカスしている行とドラッグしている行の差異は整数で表現します。
    // 正の値ならば文末方向、負の値ならば文頭方向への差異です。
    const focusedTextLineIndex = this.getFocusedTextLineIndex();
    const relativeNumberOfLines = draggingTextLineIndex - focusedTextLineIndex;
    if (relativeNumberOfLines < 0) {
      for (let i = 0; i < Math.abs(relativeNumberOfLines); i += 1) {
        this.updateSelectedRangeByArrowUp();
      }
    } else if (relativeNumberOfLines > 0) {
      for (let i = 0; i < Math.abs(relativeNumberOfLines); i += 1) {
        this.updateSelectedRangeByArrowDown();
      }
    }

    // ドラッグしている文字へ移動します。
    // 行の場合と同様に、フォーカスしている文字とドラッグしている文字の差異は正負の整数で表現します。
    const focusedCharacterIndex = this.getFocusedCharacterIndex();
    const relativeNumberOfCharacters = draggingCharacterIndex - focusedCharacterIndex;
    if (relativeNumberOfCharacters < 0) {
      for (let i = 0; i < Math.abs(relativeNumberOfCharacters); i += 1) {
        this.updateSelectedRangeByArrowLeft();
      }
    } else if (relativeNumberOfCharacters > 0) {
      for (let i = 0; i < Math.abs(relativeNumberOfCharacters); i += 1) {
        this.updateSelectedRangeByArrowRight();
      }
    }
  };
};

export {
  TOMEditor
}
