const path = require("path");

module.exports = {
  entry: "./src/tom-editor.mjs",
  experiments: {
    outputModule: true
  },
  mode: "production",
  output: {
    filename: "tom-editor.mjs",
    library: {
      type: "module"
    },
    path: path.resolve(__dirname, "dist"),
  }
};
