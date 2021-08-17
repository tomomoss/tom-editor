# TOM Editor

TOM Editorは簡素なエディターライブラリです。

現在、バージョン2.3.0です。以下より動作確認ができます。

[TOM Editor 2.3.0 動作確認ページ](https://tomomoss.github.io/tom-editor/trial)

## 導入手順

### <script>タグで読みこむ場合

`dist` ディレクトリにある `tom-editor.css` を適当な階層に配置し、 `<link>` タグなどで読みこんでください。

`dist` ディレクトリにある `tom-editor.js` を適当な階層に配置し、当該ファイルを参照するJavaScriptファイルをよりも先に読みこんでください。

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

グローバルに公開されている `TOMEditor` クラスをインスタンス化してください。エディターを実装する対象となるHTML要素を第1引数に渡してください。

```javascript
const tomEditorContainer = document.querySelector(".tom-editor-container");
const tomEditor = new TOMEditor(tomEditorContainer);
```

### ES Modulesとしてimport文で読みこむ場合

`dist` ディレクトリにある `tom-editor.css` を適当な階層に配置し `<link>` タグなどで読みこんでください。

`dist` ディレクトリにある `tom-editor.mjs` を適当な階層に配置し、適当なJavaScriptファイル内から読みこんでください。

```javascript
import {
  TOMEditor
} from "./tom-editor.mjs";
```

`tom-editor.mjs` が公開している `TOMEditor` クラスをインスタンス化してください。エディターを実装する対象となるHTML要素を第1引数に渡してください。

```javascript
import {
  TOMEditor
} from "./tom-editor.mjs";

const tomEditorContainer = document.querySelector(".tom-editor-container");
const tomEditor = new TOMEditor(tomEditorContainer);
```

## 設定

インスタンス化時にエディターの挙動を制御する情報をまとめたオブジェクトを渡すことができます。第2引数に当該オブジェクトを指定してください。省略された場合は基本設定が適用されます。

```javascript
const tomEditorContainer = document.querySelector(".tom-editor-container");
const setting = {
  readonly: true
};
const tomEditor = new TOMEditor(tomEditorContainer, setting);
```

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
