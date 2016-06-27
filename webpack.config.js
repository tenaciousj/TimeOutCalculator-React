var path = require('path');
var webpack = require('webpack');

module.exports = {
  quiet: true,
  entry: [
    './src/js/app'
  ],
  output: {
    path: __dirname + '/dist/js/',
    filename: 'app.min.js',
    publicPath: '/js/'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel'],
      include: path.join(__dirname, './src/js/')
    }]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      minimize: true,
       compress: {
          warnings: false
      }
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"'
    })
  ]
};
