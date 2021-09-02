const path = require("path");

module.exports = {
  entry: "./src/main.ts",
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
    filename: "tom-editor.js",
    library: {
      type: "window"
    },
    path: path.resolve(__dirname, "dist"),
  },
  resolve: {
    extensions: [".ts"]
  }
};
