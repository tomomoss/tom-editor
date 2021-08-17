const path = require("path");

module.exports = {
  entry: "./src/tom-editor.mjs",
  mode: "production",
  output: {
    filename: "tom-editor.js",
    library: {
      type: "window"
    },
    path: path.resolve(__dirname, "dist"),
  }
};
