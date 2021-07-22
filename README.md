# TOM Editor

TOM EditorはJavaScriptだけで構築されたエディターライブラリです。

現在、バージョン1.1.1です。以下より動作確認ができます。

[TOM Editor 1.1.1 動作確認ページ](https://tomomoss.github.io/tom-editor/)

## 導入手順

`src` ディレクトリに格納されている `.mjs` ファイルがTOM Editorを構成するファイルとなります。

それらファイルを同じ階層に配置し、当ライブラリのエントリポイントとなる `tom-editor.mjs` を適当なJavaScriptファイルから読み込んでください。

```javascript
// ./script/main.js
import {
  TOMEditor
} from "./tom-editor/tom-editor.mjs";
```

```html
<script defer src="./script/main.js" type="module"></script>
```

`tom-editor.mjs` が公開している `TOMEditor` クラスをインスタンス化してください。このときエディターを実装したいHTML要素をコンストラクタに渡してください。インスタンス化と同時にエディターが初期化されて使えるようになります。エディターの寸法は当該HTML要素の寸法に依存します。

```javascript
const tomEditorContainer = document.querySelector(".tom-editor-container");
const tomEditor = new TOMEditor(tomEditorContainer);
```

## パブリックAPI

### TOMEditor.value

入力された内容を取得したい場合は `value` プロパティを参照してください。なお、このプロパティは読み取り専用です。

```javascript
const tomEditorContainer = document.querySelector(".tom-editor-container");
const tomEditor = new TOMEditor(tomEditorContainer);

const inputtedValue = tomEditor.value;
```

### TOMEditor.valueObserver

入力内容に変化があるたびに呼び出したい関数があるときは `valueObserver` プロパティに当該関数を代入してください。

渡された関数の第1引数（以下例での `value` ）には変化後の入力内容が格納されています。

```javascript
const tomEditorContainer = document.querySelector(".tom-editor-container");
const tomEditor = new TOMEditor(tomEditorContainer);

tomEditor.valueObserver = (value)) => {
  console.log(value);
};
```
