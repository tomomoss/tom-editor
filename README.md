# TOM Editor

TOM EditorはJavaScriptだけで構築されたエディターライブラリです。

現在、バージョン2.1.0です。以下より動作確認ができます。

[TOM Editor 2.1.0 動作確認ページ](https://tomomoss.github.io/tom-editor/)

## 導入手順

`src` ディレクトリに格納されているファイルがTOM Editorを構成するファイルとなります。

`tom-editor.css` は適当な階層に配置し `<style>` タグなどで読み込んでください。

`.mjs` ファイルは全て同じ階層に配置してください。その後、当ライブラリのエントリポイントとなる `tom-editor.mjs` を適当なJavaScriptファイルから読み込んでください。

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

## 設定

インスタンス化時にエディターの挙動を制御する情報をまとめたオブジェクトを渡すことができます。省略された場合は基本設定が適用されます。

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
