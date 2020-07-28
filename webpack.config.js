const webpack = require("webpack");
const ejs = require("ejs");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const { VueLoaderPlugin } = require("vue-loader");

const config = {
  mode: "production",
  context: __dirname + "/src",
  entry: {
    'background': "./background.js",
    "popup/popup": "./popup/popup.js",
    "popup/popupdev": "./popup/popup_dev.js",
    "options/options": "./options/options.js",
  },
  output: {
    path: __dirname + "/dist",
    filename: "[name].js",
  },
  resolve: {
    extensions: [".js", ".vue"],
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loaders: "vue-loader",
      },
      {
        test: /\.js$/,
        loader: "babel-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.scss$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|ico)$/,
        loader: "file-loader",
        options: {
          name: "[name].[ext]",
          outputPath: "assets",
          emitFile: false,
        },
      }
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      // webpack built-in plugin
      global: "window",
    }),
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),
    new CopyPlugin([
      {
        from: "assets",
        to: "assets",
        ignore: ["icon.xcf"],
      },
      {
        from: "popup/popup.html",
        to: "popup/popup.html",
        transform: transformHtml,
      },
      {
        from: "options/options.html",
        to: "options/options.html",
        transform: transformHtml,
      },
      {
        from: "manifest.json",
        to: "manifest.json",
      },
    ]),
  ],
};

function transformHtml(content) {
  return ejs.render(content.toString(), {
    ...process.env,
  });
}

module.exports = config;
