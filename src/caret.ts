/**
 * キャレットを制御します。
 * @param {Main} root ライブラリのエントリポイントです。
 * @param {boolean} readonlyFlag 読みとり専用状態ならばtrueが入ります。
 */
const Caret = class {
  constructor(root: Main, readonlyFlag: boolean) {
    this.root = root;
    this.readonlyFlag = readonlyFlag;
    this.styleClass = {
      caret: {
        element: "tom-editor__caret",
        modifier: {
          animation: "tom-editor__caret--animation",
          focus: "tom-editor__caret--focus"
        }
      }
    };
    this.caret = this.createCaret();
    this.definePublishingEventListeners();
    this.defineSubscribingEventListeners();
  }

  /** @type {HTMLTextAreaElement} キャレットです。 */
  caret: HTMLTextAreaElement;

  /** @type {boolean} 読みとり専用状態ならばtrueが入ります。 */
  readonlyFlag: boolean;

  /** @type {Main} ライブラリのエントリポイントです。 */
  root: Main;

  /** @type {CaretStyleClass} 当クラスで使用するCSSクラスをまとめたオブジェクトです。 */
  styleClass: CaretStyleClass;

  /**
   * キャレットを生成します。
   * @returns {HTMLTextAreaElement} キャレットです。
   */
  createCaret = (): HTMLTextAreaElement => {
    const caret = document.createElement("textarea");
    caret.classList.add(this.styleClass.caret.element);
    return caret;
  };

  /**
   * 出版用イベントリスナーを定義します。
   */
  definePublishingEventListeners = (): void => {

    // 読みとり専用状態にする場合は一部のイベントリスナーの定義を省略します。
    if (this.readonlyFlag) {
      return;
    }

    // 変換セッションの終了と変換結果を発信します。
    this.caret.addEventListener("compositionend", (): void => {
      this.root.dispatchEvent(new CustomEvent("TOMEditor-compositionend", {} as TOMEditorCompositionEndEvent));
    });

    // 変換セッションの開始を発信します。
    this.caret.addEventListener("compositionstart", (): void => {
      this.root.dispatchEvent(new CustomEvent("TOMEditor-compositionstart", {} as TOMEditorCompositionStartEvent));
    });

    // キャレットからフォーカスが外れたことを発信します。
    this.caret.addEventListener("blur", (): void => {
      this.root.dispatchEvent(new CustomEvent("TOMEditor-blur", {} as TOMEditorBlurEvent));
    });

    // 文章の変換中情報を発信します。
    this.caret.addEventListener("input", (event: InputEventInit): void => {
      this.root.dispatchEvent(new CustomEvent("TOMEditor-input", {
        detail: {
          data: event.data,
          selectionStart: this.caret.selectionStart
        } as TOMEditorInputEvent
      }));
    });

    // 入力されたキー情報を発信します。
    // Tabキーによるフォーカスの移動やCtrlキーとファンクションキーを同時押ししてのショートカット処理といった、
    // ブラウザ標準動作が走ると何が起こるか予想できないのでEvent.preventDefaultメソッドを呼んでおきます。
    this.caret.addEventListener("keydown", (event): void => {
      event.preventDefault();
      this.root.dispatchEvent(new CustomEvent("TOMEditor-keydown", {
        detail: {
          ctrlKey: event.ctrlKey,
          key: event.key,
          shiftKey: event.shiftKey
        } as TOMEditorKeyDownEvent
      }));
    });
  };

  /**
   * 購読用イベントリスナーを定義します。
   */
  defineSubscribingEventListeners = (): void => {

    // 第1次初期化処理を実行します。
    this.root.addEventListener("TOMEditor-firstinitialize", (event: CustomEventInit<TOMEditorFirstInitializeEvent>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("Caret.prototype.defineSubscribingEventListeners: TOMEditor-initializeイベントのdetailプロパティが空です。");
      }
      event.detail.editor.appendChild(this.caret);
    });

    // 読みとり専用状態にする場合は一部のイベントリスナーの定義を省略します。
    if (this.readonlyFlag) {
      return;
    }

    // フォーカス位置が変更されたので、変更後の座標にキャレットを移動させます。
    this.root.addEventListener("TOMEditor-movefocuspointposition", (event: CustomEventInit<TOMEditorMoveFocusPointPositionEvent>): void => {
      if (typeof event.detail === "undefined") {
        throw new Error("Caret.prototype.defineSubscribingEventListeners: TOMEditor-movefocuspointpositionイベントのdetailプロパティが空です。");
      }
      if (event.detail.left === null || event.detail.top === null) {
        this.takeCaret();
      } else {
        this.putCaret(event.detail.left, event.detail.top);
      }
    });
  };

  /**
   * キャレットを配置・表示します。
   * @param {number} left 水平座標です。
   * @param {number} top 垂直座標です。
   */
  putCaret = (left: number, top: number): void => {
    this.caret.classList.add(this.styleClass.caret.modifier.focus);
    this.caret.style.left = `${left}px`;
    this.caret.style.top = `${top}px`;
    this.caret.focus();

    // キャレットの点滅処理はCSSのKeyframe Animationで実装しており、
    // 当該CSSクラスを適用した瞬間にアニメーションが再生されるようになっています。
    // アニメーションはキャレットに何らかの有効なキー入力があるたびにイチから再生される必要がありますが、
    // 普通にクラスを付けても再生中のアニメーションはそのときの状態のまま流れつづけてしまいます。
    // そこで、非同期処理にするとともに0.05sほど遅延させることで上記の想定どおりの挙動を実現しています。
    this.caret.classList.remove(this.styleClass.caret.modifier.animation);
    setTimeout((): void => {
      this.caret.classList.add(this.styleClass.caret.modifier.animation);
    }, 50);
  };

  /**
   * キャレットを除外・非表示にします。
   */
  takeCaret = (): void => {
    this.caret.classList.remove(this.styleClass.caret.modifier.animation, this.styleClass.caret.modifier.focus);
  };
};

export {
  Caret
}
