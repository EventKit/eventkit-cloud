var webpack = require('webpack');
var path = require('path');
var WriteFilePlugin = require('write-file-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

var BASE_DIR = path.resolve('/var', 'lib', 'eventkit', 'eventkit_cloud', 'ui', 'static', 'ui')
var BUILD_DIR = path.resolve(BASE_DIR, 'build');
var APP_DIR = path.resolve(BASE_DIR, 'app');

var PROD = JSON.parse(process.env.PROD || false);
var devtool = 'source-map';
var plugins = [
    new WriteFilePlugin(),
    new ExtractTextPlugin('styles.css'),
    new webpack.optimize.CommonsChunkPlugin({
        name:'node-modules', 
        filename: 'node-modules.js', 
        minChunks(module, count) {
            var context = module.context;
            return context && context.indexOf('node_modules') >= 0;
        }
    }),
    new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: 'report.html'
    })
];
var app = [APP_DIR + '/index.js'];

var config = {
    devtool: devtool,
    entry: {
        app: app,
    },
    output: {
        path: BUILD_DIR,
        filename: 'bundle.js',
        publicPath: '/static/ui/build/'
    },
    resolve: {
        extensions: ['.js', '.jsx']
    },
    module: {
        loaders: [
            {
                test: /\.js?$/,
                exclude: [/node_modules\/(?!jsts)/, /staticfiles/],
                loader: ['babel-loader?presets[]=es2015,presets[]=react,presets[]=stage-0'],
            },
            {
                test: /\.css$/,
                loader: 'style-loader'
            }, {
                test: /\.css$/,
                loader: 'css-loader?modules=true,localIdentName=[name]__[local]___[hash:base64:5]',
            },
            {
                test: /\.(woff2?|ttf|eot)$/,
                loader: 'url-loader?limit=100000,name=fonts/[hash].[ext]',
            },
            {
                test: /\.(svg|png|jpg|gif)$/,
                loader: 'url-loader?limit=100000,name=images/[hash].[ext]',
            }
        ],
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

if (PROD) {
    config.plugins.push(new webpack.DefinePlugin({'process.env.NODE_ENV': "'production'"}));
    config.plugins.push(new webpack.optimize.UglifyJsPlugin({
        compress: { warnings: false },
        sourceMap: false,
    }));
} else {
    config.entry.app.push('webpack-dev-server/client?http://0.0.0.0:8080')
    config.plugins.push(new webpack.HotModuleReplacementPlugin());
    config.devtool = 'inline-source-map';
}


module.exports = config;
