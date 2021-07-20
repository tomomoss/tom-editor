# TOM Editor

TOM EditorはJavaScriptだけで構築されたエディターライブラリです。

現在、バージョン1.0.0です。以下より動作確認ができます。

[TOM Editor 1.0.0 動作確認ページ](https://tomomoss.github.io/tom-editor/)

## 取り扱い説明

TOM Editorを構成する全てのファイルを同じ階層に配置し、当ライブラリのエントリポイントとなる `tom-editor.mjs` を適当なJavaScriptファイルから読み込んでください。

```javascript
<script defer src="./script/main.js" type="module"></script>
```

`tom-editor.mjs` が公開している `TOMEditor` クラスをインスタンス化してください。このときエディターを実装したいHTML要素をコンストラクタに渡してください。インスタンス化と同時にエディターが初期化されて使えるようになります。エディターの寸法は当該HTML要素の寸法に依存します。

```javascript
const tomEditorContainer = document.querySelector(".tom-editor-container");
const tomEditor = new TOMEditor(tomEditorContainer);
```

入力された内容を取得したい場合は `value` プロパティを参照してください。なお、このプロパティは読み取り専用です。

```javascript
const tomEditorContainer = document.querySelector(".tom-editor-container");
const tomEditor = new TOMEditor(tomEditorContainer);

const inputtedValue = tomEditor.value;
```
