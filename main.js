"use strict";

import {
  TOMEditor
} from "./src/tom-editor.mjs";

const tomEditorContainer = document.querySelector(".tom-editor-container");
const tomEditor = new TOMEditor(tomEditorContainer);
const gettingEditorValueButton = document.querySelector(".header__getting-editor-value-button");
gettingEditorValueButton.addEventListener("click", () => {
  alert(tomEditor.value);
});
