const path = require("path");

module.exports = {
  entry: "./src/tom-editor.mjs",
  mode: "production",
  module: {
    rules: [{
      test: /\.css$/,
      use: ["style-loader", "css-loader"]
    }]
  },
  output: {
    filename: "tom-editor.js",
    library: {
      type: "window"
    },
    path: path.resolve(__dirname, "dist"),
  }
};
