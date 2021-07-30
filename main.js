"use strict";

import {
  TOMEditor
} from "./src/tom-editor.mjs";
import {
  TOMEditorByjQuery
} from "./src-jquery/tom-editor.mjs";

/**
 * TOM Editorの実装を切り替えます。
 * @param {string} architecture 切り替え対象となる実装です。
 */
const changeArchitecture = (architecture) => {

  // 選択された実装に合わせて初期化するTOMEditorオブジェクトとスタイルシートを変更します。
  let architectureStylesheetTagPath;
  let instanceTOMEditorObject;
  if (architecture === "vannila") {
    architectureStylesheetTagPath = "./src/tom-editor.css";
    instanceTOMEditorObject = TOMEditor;
  }
  if (architecture === "jquery") {
    architectureStylesheetTagPath = "./src-jquery/tom-editor.css";
    instanceTOMEditorObject = TOMEditorByjQuery;
  }

  // スタイルシートを読み込むlinkタグを生成・挿入します。
  const architectureStylesheetTag = document.createElement("link");
  architectureStylesheetTag.href = architectureStylesheetTagPath;
  architectureStylesheetTag.rel = "stylesheet";
  const commonStylesheetTag = document.querySelector("link");
  commonStylesheetTag.nextElementSibling.remove();
  commonStylesheetTag.after(architectureStylesheetTag);

  // TOM Editorを実装します。
  const tomEditorContainer = document.querySelector(".tom-editor-container");
  _.tomEditor = new instanceTOMEditorObject(tomEditorContainer);
};

/**
 * エディターに入力された値を取得して表示する処理を実装します。
 */
const initializeGettingEditorValue = () => {
  const gettingEditorValueButton = document.querySelector(".header__getting-editor-value-button");
  gettingEditorValueButton.addEventListener("click", () => {
    alert(_.tomEditor.value);
  });
};

/**
 * TOM Editorの実装を切り替える処理を実装します。
 */
const initializeSelectArchitecture = () => {
  const architectureSelector = document.querySelector(".footer__architecture-selector");
  architectureSelector.addEventListener("change", () => {
    changeArchitecture(architectureSelector.value);
  });

  // ページ開始時点ではVanilla.js（ECMAScript）実装のTOM Editorを配置します。
  changeArchitecture("vannila");
};

// TOM Editorのインスタンスを格納する変数は各関数から直接参照できるようにしておきます。
const _ = {
  tomEditor: undefined
};

initializeSelectArchitecture();
initializeGettingEditorValue();
