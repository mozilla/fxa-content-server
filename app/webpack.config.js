var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: path.join(__dirname, 'scripts', 'main.js'),
  output: {
    publicPath: '/dist/',
    path: path.join(__dirname, 'dist'),
    filename: "app.js"
  },
  resolve: {
    extensions: ['', '.js', '.mustache'],
    alias: {
      // TODO: FACTORIZE WITH require_config
      jquery: 'jquery/dist/jquery',
      backbone: 'backbone/backbone',
      underscore: 'underscore/underscore',
      fxaClient: 'fxa-js-client/client/FxAccountClient',
      text: 'requirejs-text/text',
      mustache: 'mustache/mustache',
      stache: 'requirejs-mustache/stache',
      chai: 'chai/chai',
      cocktail: 'cocktail/Cocktail',
      sjcl: 'sjcl/sjcl',
      sinon: 'sinon/index',
      p: 'p/p',
      speedTrap: 'speed-trap/dist/speed-trap',
      md5: 'JavaScript-MD5/js/md5',
      canvasToBlob: 'blueimp-canvas-to-blob/js/canvas-to-blob',
      moment: 'moment/moment',
      mailcheck: 'mailcheck/src/mailcheck',
      crosstab: 'vendor/crosstab',
      uuid: 'node-uuid/uuid',
      draggable: 'jquery-ui/ui/draggable',
      'touch-punch': 'jquery-ui-touch-punch/jquery.ui.touch-punch',
      raven: 'raven-js/dist/raven'
    },
    modulesDirectories: ['scripts', 'bower_components', 'node_modules']
  },
  devtool: 'source-map',
  module: {
    noParse: [
      /sinon/
    ]
  },
  plugins: [
    new webpack.NormalModuleReplacementPlugin(/^sinon$/, __dirname + '/bower_components/sinon/index.js'),
    new webpack.ProvidePlugin({
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    })
  ]
};
