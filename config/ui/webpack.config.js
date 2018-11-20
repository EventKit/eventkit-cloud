/* eslint-disable */
var webpack = require('webpack');
var path = require('path');
var WriteFilePlugin = require('write-file-webpack-plugin');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
var CompressionPlugin = require('compression-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var CleanWebpackPlugin = require('clean-webpack-plugin');
var UglifyJsPlugin = require('uglifyjs-webpack-plugin');

var BASE_DIR = path.resolve('eventkit_cloud', 'ui', 'static', 'ui')
var BUILD_DIR = path.resolve(BASE_DIR, 'build');
var APP_DIR = path.resolve(BASE_DIR, 'app');

var PROD = JSON.parse(process.env.PROD || false);
var devtool = 'cheap-source-map';
var plugins = [
    new CleanWebpackPlugin([BUILD_DIR]),
    new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: 'report.html'
    }),
    new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/),
    new webpack.HashedModuleIdsPlugin(),
    new CompressionPlugin({
        test: /(\.js$|\.css$)/
    }),
    new ExtractTextPlugin({ filename: '[name].css' })
];
var app = [APP_DIR + '/index.tsx'];
var config = {
    mode: PROD ? 'production' : 'development',
    devtool: devtool,
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
                    { loader: 'babel-loader' },
                    { loader: 'ts-loader' },
                ]
            },
            {
                test: /\.js?$/,
                exclude: [/node_modules\/(?!jsts)/, /staticfiles/],
                use: {
                    loader: 'babel-loader',
                },
            },
            {
                // process all the scoped imports
                include: /(ol3map.css$|typeahead.css$|popup.css$)/,
                use: [
                    { loader: 'style-loader' },
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            localIdentName: '[name]__[local]___[hash:base64:5]',
                            minimize: true,
                        },
                    },
                ],
            },
            {
                // process all the global css imports
                test: /\.css$/,
                exclude: /(ol3map.css|typeahead.css$|popup.css$)/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [{ loader: 'css-loader', options: { minimize: true }}]
                })
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
                    },
                },
            }
        ],
    },
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                uglifyOptions: {
                    compress: {
                        drop_console: true,
                    }
                }
            })
        ],
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
        hot: true,
        contentBase: BASE_DIR,
        watchContentBase: true,
        publicPath: BUILD_DIR,
        host: "0.0.0.0",
        port: 8080,
        historyApiFallback: true,
        disableHostCheck: true,
        watchOptions: {
            poll: true
        },
        inline: true
    },
};

if (!PROD) {
    config.plugins.push(new WriteFilePlugin({
        test: /^(?!.*(hot)).*/, // exclude hot-update files
    }));
    config.entry.bundle.push('webpack-dev-server/client?http://0.0.0.0:8080');
    config.plugins.push(new webpack.HotModuleReplacementPlugin());
    config.devtool = 'inline-source-map';
}

module.exports = config;
