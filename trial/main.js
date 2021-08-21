"use strict";

import {
  TOMEditor
} from "../dist/tom-editor.mjs";

/**
 * TOM Editorの実装対象となるHTML要素を作成します。
 * @param {string} mode シングルモード・マルチプルモードのどちらを生成するかを決めるフラグです。
 * @returns {HTMLDivElement} TOM Editorの実装対象となるHTML要素です。
 */
const createTOMEditorContainer = (mode) => {
  const tomEditorContainer = document.createElement("div");
  if (mode === "single") {
    tomEditorContainer.classList.add("main__tom-editor-container");
  } else if (mode === "multiple") {
    tomEditorContainer.classList.add("main__tom-editor-container", "main__tom-editor-container--multiple");
  } else {
    throw new TypeError(`不正な引数です（${mode}）。`);
  }
  return tomEditorContainer;
};

const main = document.querySelector(".main");

// シングルモード時のエディター実装処理です。
const singleModeRadio = document.querySelector("input[value='single'");
singleModeRadio.addEventListener("change", () => {

  // <main>タグを初期化します。
  main.innerHTML = "";
  if (main.classList.contains("main--multiple")) {
    main.classList.remove("main--multiple");
  }

  // エディターを実装します。
  const editorContainer = createTOMEditorContainer(singleModeRadio.value);
  main.appendChild(editorContainer);
  new TOMEditor(editorContainer);
});

// マルチプルモード時のエディター実装処理です。
const multipleModeRadio = document.querySelector("input[value='multiple'");
multipleModeRadio.addEventListener("change", () => {

  // <main>タグを初期化します。
  main.innerHTML = "";
  main.classList.add("main--multiple");

  // エディターを実装します。
  const inputEditorContainer = createTOMEditorContainer(multipleModeRadio.value);
  const outputEditorContainer = createTOMEditorContainer(multipleModeRadio.value);
  main.appendChild(inputEditorContainer);
  main.appendChild(outputEditorContainer);
  const inputEditor = new TOMEditor(inputEditorContainer);
  const outputEditor = new TOMEditor(outputEditorContainer, {readonly: true});

  // エディター間を連携させます。
  inputEditor.valueObserver = (value) => {
    outputEditor.value = value;
  };
});

// ページ読みこみ時はシングルモードで立ちあげます。
singleModeRadio.dispatchEvent(new Event("change"));
