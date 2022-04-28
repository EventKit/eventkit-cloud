/* eslint-disable */
var webpack = require('webpack');
var path = require('path');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
var CompressionPlugin = require('compression-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
var { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")

var BASE_DIR = path.resolve('eventkit_cloud', 'ui', 'static', 'ui');
var BUILD_DIR = path.resolve(BASE_DIR, 'build');
var APP_DIR = path.resolve(BASE_DIR, 'app');

var PROD = JSON.parse(process.env.PROD || false);
var plugins = [
    new CleanWebpackPlugin(),
    new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: 'report.html'
    }),
    new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/),
    new CompressionPlugin({
        exclude: /(\.js$)/
    }),
    new MiniCssExtractPlugin({filename: '[name].css'}),
    new NodePolyfillPlugin()
];
var app = [APP_DIR + '/index.tsx'];
var config = {
    mode: PROD ? 'production' : 'development',
    entry: {
        bundle: app,
    },
    output: {
        path: BUILD_DIR,
        filename: '[name].js',
        chunkFilename: '[name].[chunkhash].js',
        publicPath: '/static/ui/build/'
    },
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: [/node_modules\/(?!jsts)/, /staticfiles/],
                use: [
                    // cache expensive loader operations
                    { loader: 'babel-loader' },
                    { loader: 'ts-loader' },
                ]
            },
            {
                test: /\.js?$/,
                exclude: [/node_modules\/(?!jsts)/, /staticfiles/],
                use: [
                    // cache expensive loader operations
                    {loader: 'babel-loader'},
                ],
            },
            {
                // process all the scoped imports
                include: /(ol3map.css$|typeahead.css$|popup.css$)/,
                use: [
                    { loader: 'style-loader' },
                    {
                        loader: 'css-loader',
                        options: {
                            modules: {
                                localIdentName: '[name]__[local]___[hash:base64:5]',
                            },
                        },
                    },
                ],
            },
            {
                // process all the global css imports
                test: /\.css$/,
                exclude: /(ol3map.css|typeahead.css$|popup.css$)/,
                use: [
                    { loader: MiniCssExtractPlugin.loader },
                    { loader: "css-loader" }
                ],
            },
            {
                test: /\.(woff2?|ttf|eot)$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        limit: 100000,
                        name: 'fonts/[hash].[ext]',
                    },
                },
            },
            {
                test: /\.(svg|png|jpg|gif)$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        limit: 100000,
                        name: 'images/[hash].[ext]',
                        esModule: false,
                    },
                },
            }
        ],
    },
    optimization: {
        minimizer: [new TerserPlugin()],
        splitChunks: {
            cacheGroups: {
                commons: {
                    chunks: 'all',
                    minChunks: 2,
                    priority: -5,
                    test: /[\\/]node_modules[\\/]/,
                    enforce: true,
                },
                mui: {
                    name: 'mui',
                    chunks: 'all',
                    minChunks: 2,
                    test: /node_modules\/material-ui/,
                    enforce: true,
                },
                ol: {
                    name: 'openlayers',
                    chunks: 'all',
                    minChunks: 2,
                    test: /node_modules\/ol/,
                    enforce: true,
                },
                jsts: {
                    name: 'jsts',
                    chunks: 'all',
                    minChunks: 2,
                    test: /node_modules\/jsts/,
                    enforce: true,
                },
            }
        }
    },
    plugins: plugins,
    devServer: {
        host: "0.0.0.0",
        port: 8080,
        hot: true,
        historyApiFallback: true,
        allowedHosts: 'all',
        static: {
            directory: BASE_DIR,
            publicPath: BUILD_DIR,
        },
        devMiddleware: {
            writeToDisk: true,
        },
    },
    watchOptions: {
        poll: true
    },
};

if (!PROD) {
    config.entry.bundle.push('webpack-dev-server/client?http://0.0.0.0:8080');
    config.devtool = 'eval-cheap-module-source-map';
}

module.exports = config;
