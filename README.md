# TOM Editor

TOM Editorは簡素なエディターライブラリです。

現在、バージョン4.3.0です。以下より動作確認ができます。

[TOM Editor 4.3.0 動作確認ページ](https://tomomoss.github.io/tom-editor/trial)

## 導入手順

当ライブラリでは `<script>` タグで読みこむ方法と、 `import` 文で読みこむ方法の2種類を用意しています。

`<script>` タグで読みこむ場合は `dist` ディレクトリにある `tom-editor.js` を適当な階層に配置し、当該ファイルを参照するスクリプトファイルをよりも先に読みこんでください。

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="./tom-editor.js"></script>
    <script src="./main.js"></script>
  </head>
</html>
<body> ... </body>
```

`import` 文でエディターオブジェクトをES Modulesとして読みこむ場合は `dist` ディレクトリにある `tom-editor.mjs` を適当な階層に配置し、適当なスクリプトファイル内から読みこんでください。

```javascript
import {
  TOMEditor
} from "./tom-editor.mjs";
```

それぞれの方法で読みこんだ後はライブラリから公開されている `TOMEditor` クラスをインスタンス化してください。

第1引数にはエディターを実装する対象となるHTML要素を指定してください。第1引数を省略することはできません。エディターの寸法は第1引数に指定されたHTML要素の寸法に依存します。

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

## 設定

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

この設定を適用するとキーボードによる文字の入力を行うことができなくなります。 `value` プロパティを介してのみ入力内容を変更することができます。

```javascript
const tomEditorContainer = document.querySelector(".tom-editor-container");
const setting = {
  readonly: true
};
const tomEditor = new TOMEditor(tomEditorContainer, setting);

tomEditor.value = "Hello world.";
```

また、マウス操作も受け付けなくなりますので入力内容を取得する場合は `value` プロパティを参照してください。

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

### getter: value

入力された内容を取得したい場合は `value` プロパティを参照してください。

```javascript
const tomEditorContainer = document.querySelector(".tom-editor-container");
const tomEditor = new TOMEditor(tomEditorContainer);

const inputtedValue = tomEditor.value;
```

### setter: value

エディターの内容を更新したい場合は `value` プロパティに更新する値を代入してください。

```javascript
const tomEditorContainer = document.querySelector(".tom-editor-container");
const tomEditor = new TOMEditor(tomEditorContainer);

tomEditor.value = "Hello world.";
```

### setter: valueObserver

入力内容に変化があるたびに呼び出したい関数があるときは `valueObserver` プロパティに当該関数を代入してください。

渡された関数の第1引数（以下例での `value` ）には変化後の入力内容が格納されています。

```javascript
const tomEditorContainer = document.querySelector(".tom-editor-container");
const tomEditor = new TOMEditor(tomEditorContainer);

tomEditor.valueObserver = (value) => {
  console.log(value);
};
```
