/**
 * エディター本体、およびエディター外要素を制御します。
 * @param {Main} root ライブラリのエントリポイントです。
 * @param {HTMLElement} editorContainer エディター実装対象となるHTML要素です。
 */
const Editor = class {
  constructor(root: Main, editorContainer: HTMLElement) {
    this.root = root;
    this.styleClass = {
      editor: {
        element: "tom-editor__editor"
      },
      editorWrapper: {
        element: "tom-editor__editor-wrapper"
      }
    };
    this.editorWrapper = this.createEditorWrapper();
    editorContainer.appendChild(this.editorWrapper);
    this.editor = this.createEditor();
    this.editorWrapper.appendChild(this.editor);
    this.defineEventListeners();
  }

  /** @type {HTMLDivElement} エディター本体です。 */
  editor: HTMLDivElement;

  /** @type {HTMLDivElement} エディター本体のラッパー要素です。 */
  editorWrapper: HTMLDivElement;

  /** @type {Main} ライブラリのエントリポイントです。 */
  root: Main;

  /** @type {EditorStyleClass} 当クラスで使用するCSSクラスをまとめたオブジェクトです。 */
  styleClass: EditorStyleClass;

  /**
   * エディター本体を生成します。
   * @returns {HTMLDivElement} エディター本体です。
   */
  createEditor = (): HTMLDivElement => {
    const editor = document.createElement("div");
    editor.classList.add(this.styleClass.editor.element);
    return editor;
  };

  /**
   * エディター本体のラッパー要素を生成します。
   * @returns {HTMLDivElement} エディター本体のラッパー要素です。
   */
  createEditorWrapper = (): HTMLDivElement => {
    const editorWrapper = document.createElement("div");
    editorWrapper.classList.add(this.styleClass.editorWrapper.element);
    return editorWrapper;
  };

  /**
   * イベントリスナーを定義します。
   */
  defineEventListeners = (): void => { };
};

export {
  Editor
}
