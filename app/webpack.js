var webpack = require('webpack');
var path = require('path');

module.exports = {
  // webpack options
  entry: path.join(__dirname, 'scripts', 'main.js'),
  output: {
    publicPath: '/scripts/',
    path: path.join(__dirname, 'scripts'),
    filename: 'app.js'
  },
  resolve: {
    extensions: ['', '.js', '.mustache'],
    alias: {
      jquery: 'jquery/dist/jquery',
      backbone: 'backbone/backbone',
      underscore: 'underscore/underscore',
      fxaClient: 'fxa-js-client/fxa-client.js',
      text: 'requirejs-text/text',
      mustache: 'mustache/mustache',
      stache: 'requirejs-mustache/stache',
      chai: 'chai/chai',
      'p-promise': 'p/p',
      sinon: 'sinon/index',
      speedTrap: 'speed-trap/dist/speed-trap',
      md5: 'JavaScript-MD5/js/md5',
      draggable: 'jquery-ui/ui/draggable'
    },
    modulesDirectories: [
      path.join(__dirname, 'scripts'),
      path.join('..', __dirname, 'bower_components')
    ]
  },
  devtool: {
    //'source-map': true
  },
  module: {
    loaders: [

    ],
    noParse: [
      // See issue: https://github.com/webpack/webpack/issues/387
      /p\.js$/
    ]
  }
};
