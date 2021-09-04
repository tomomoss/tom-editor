# TOM Editor

TOM Editorはブラウザ環境に簡素なエディターを実装するライブラリです。

現在のバージョンは4.4.2です。以下より動作確認ができます。

[TOM Editor 4.4.2動作確認ページ](https://tomomoss.github.io/tom-editor/trial)

## 導入手順

当ライブラリは `<script>` タグで読みこむ方法と、 `import` 文で読みこむ方法の2種類を用意しています。

`<script>` タグで読みこむ場合は `dist` ディレクトリにある `tom-editor.js` を適当な階層に配置し、当該ファイルを参照するスクリプトファイルをよりも先に読みこむようにしてください。

```html
<!DOCTYPE html>
<html>
  <head>

    <!-- 当ライブラリ -->
    <script src="./tom-editor.js"></script>

    <!-- 当ライブラリを読みこむスクリプトファイル -->
    <script src="./main.js"></script>
  </head>
</html>
<body> ... </body>
```

`import` 文で読みこむ場合は `dist` ディレクトリにある `tom-editor.mjs` を適当な階層に配置し、適当なスクリプトファイル内から読みこんでください。

```javascript
// 当ライブラリを読みこむ適当なスクリプトファイル
import {
  TOMEditor
} from "./tom-editor.mjs";
```

それぞれの方法で読みこんだ後はライブラリから公開されている `TOMEditor` クラスをインスタンス化してください。

```javascript
const tomEditor = new TOMEditor(editorContainer [, editorOption]);
```

第1引数にはエディターを実装する対象となるHTML要素を指定してください。第1引数を省略することはできません。なお、 **エディターの寸法は第1引数に指定されたHTML要素の寸法に依存する** ため寸法の制御は呼びだし側で行ってください。

第2引数にはエディターの挙動を制御するオブジェクトを渡すことができます。第2引数は省略することができます。省略した場合は初期設定が適用されます。

```javascript
// <script>タグで読みこんだ場合
const tomEditorContainer = document.querySelector(".tom-editor-container");
const setting = { ... };
const tomEditor = new TOMEditor(tomEditorContainer, setting);
```

```javascript
// ES Modulesとして読みこんだ場合
import {
  TOMEditor
} from "./tom-editor.mjs";

const tomEditorContainer = document.querySelector(".tom-editor-container");
const setting = { ... };
const tomEditor = new TOMEditor(tomEditorContainer, setting);
```

## エディターの設定

`TOMEditor` クラスのコンストラクタの第2引数にはエディターの挙動を制御する情報をまとめたオブジェクトを渡すことができます。

### readonly

TOM Editorを入力するための領域ではなく、文章を表示するための読み取り専用領域として使用したい場合は `readonly` プロパティに `true` を設定してください。

```javascript
const tomEditorContainer = document.querySelector(".tom-editor-container");
const setting = {
  readonly: true
};
const tomEditor = new TOMEditor(tomEditorContainer, setting);
```

この設定を適用するとキーボードによる文字の入力を行うことができなくなります。入力内容の変更は後述する `TOMEditor.prototype.value` APIを介してのみ行うことができます。

```javascript
const tomEditorContainer = document.querySelector(".tom-editor-container");
const setting = {
  readonly: true
};
const tomEditor = new TOMEditor(tomEditorContainer, setting);

tomEditor.value = "Hello world.";
```

また、マウス操作も受け付けなくなりますので入力内容を取得する場合も `TOMEditor.prototype.value` APIを利用するようにしてください。

```javascript
const tomEditorContainer = document.querySelector(".tom-editor-container");
const setting = {
  readonly: true
};
const tomEditor = new TOMEditor(tomEditorContainer, setting);

tomEditor.value = "Hello world.";
console.log(tomEditor.value);
```

## API

### TOMEditor.version

`TOMEditor.version` APIはライブラリのバージョン情報を `string` 型で返します。

```javascript
const version = TOMEditor.version;

// 4.4.0
console.log(version);
```

### TOMEditor.prototype.value

`TOMEditor.prototype.value` APIはエディターに入力されている値を取得したり、任意の値に変更するのに使用します。

```javascript
const tomEditorContainer = document.querySelector(".tom-editor-container");
const tomEditor = new TOMEditor(tomEditorContainer);

// 入力されている内容を取得する場合
const inputtedValue = tomEditor.value;
```

```javascript
const tomEditorContainer = document.querySelector(".tom-editor-container");
const tomEditor = new TOMEditor(tomEditorContainer);

// 任意の値に変更する場合
tomEditor.value = "Hello world.";
```

### TOMEditor.prototype.valueObserver

`TOMEditor.prototype.valueObserver` APIはエディターの入力内容が変化するたびに呼びだしたいコールバック関数を指定するためのAPIです。

コールバック関数の第1引数には変更後のエディター内容が渡されます。

```javascript
const tomEditorContainer = document.querySelector(".tom-editor-container");
const tomEditor = new TOMEditor(tomEditorContainer);

// 以下「value」に変更後のエディターの入力内容が格納されています。
tomEditor.valueObserver = (value) => {
  console.log(value);
};
```
