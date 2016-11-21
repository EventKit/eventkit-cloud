var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve('eventkit_cloud','ui','static','ui','build');
var APP_DIR = path.resolve('eventkit_cloud','ui','static','ui', 'app');

var config = {
    entry: APP_DIR + '/main.js',
    output: {
        path: BUILD_DIR,
        filename: 'bundle.js'
    },
    resolve: {
        extensions: ['', '.js', '.jsx']
      },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: 'babel',
                query: {
                    cacheDirectory: true,
                    presets: ['react', 'es2015']
                }
            }
        ]
    }
};


module.exports = config;