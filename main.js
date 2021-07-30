"use strict";

import {
  TOMEditor
} from "./src/script/tom-editor.mjs";

// TOM Editorを初期化・配置します。
const tomEditorContainer = document.querySelector(".tom-editor-container");
const tomEditor = new TOMEditor(tomEditorContainer);

// 入力内容取得ボタンをクリックしたときはwindow.alertメソッドで内容を表示します。
document.querySelector(".get-content-button").addEventListener("click", () => {
  alert(tomEditor.value);
});
