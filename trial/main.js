"use strict";

import {
  TOMEditor
} from "../dist/tom-editor.mjs";

const tomEditorContainer = document.querySelector(".tom-editor-container");
window.tomEditor = new TOMEditor(tomEditorContainer);
