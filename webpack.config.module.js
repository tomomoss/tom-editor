const path = require("path");

module.exports = {
  entry: "./src/main.ts",
  experiments: {
    outputModule: true
  },
  mode: "production",
  module: {
    rules: [{
      test: /\.scss$/,
      use: ["style-loader", "css-loader", "sass-loader"]
    }, {
      test: /\.ts$/,
      use: ["ts-loader"]
    }]
  },
  output: {
    filename: "tom-editor.mjs",
    library: {
      type: "module"
    },
    path: path.resolve(__dirname, "dist"),
  },
  resolve: {
    extensions: [".ts"]
  }
};
