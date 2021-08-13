"use strict";

import {
  TOMEditor
} from "../src/tom-editor.mjs";

const tomEditorContainer = document.querySelector(".tom-editor-container");
window.tomEditor = new TOMEditor(tomEditorContainer);
