/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* eslint-disable */
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const SriPlugin = require('webpack-subresource-integrity');

const path = require('path');
const ENV = process.env.NODE_ENV || 'development';

console.log('ENV', ENV);

module.exports = {
	context: path.resolve(__dirname, 'app/scripts'),
	entry: {
		app: './app.js',
		appDependencies: [
			'lib/jquery',
			'backbone',
			'canvasToBlob',
			'cocktail-lib',
			'draggable',
			'duration',
			'es6-promise',
			'fxaCheckbox',
			'jquery',
			'mailcheck',
			'md5',
			'modal',
			'raven',
			'speed-trap',
			'touch-punch',
			'ua-parser-js',
			'uuid',
			'vat',
			'webrtc',
		],
		head: './head/boot.js'
	},

	output: {
		crossOriginLoading: 'anonymous',
		filename: '[name].bundle.js',
		chunkFilename: '[name].bundle.js',
		path: path.resolve(__dirname, 'app'),
		publicPath: '/'
	},

	resolve: {
		extensions: ['.js'],
		modules: [
			path.resolve(__dirname, 'app/scripts'),
			path.resolve(__dirname, 'app/scripts/templates'),
			path.resolve(__dirname, 'app'),
			path.resolve(__dirname, 'node_modules'),
			'node_modules'
		],
		alias: {
			backbone: path.resolve(__dirname, 'app/bower_components/backbone/backbone'),
			canvasToBlob: path.resolve(__dirname, 'app/bower_components/blueimp-canvas-to-blob/js/canvas-to-blob'),
			chai: path.resolve(__dirname, 'app/bower_components/chai/chai'),
			'cocktail-lib': path.resolve(__dirname, 'app/bower_components/cocktail/Cocktail'),
			cocktail: path.resolve(__dirname, 'app/scripts/lib/cocktail'),
			draggable: path.resolve(__dirname, 'app/bower_components/jquery-ui/ui/draggable'),
			duration: path.resolve(__dirname, 'app/bower_components/Duration.js/duration'),
			'es6-promise': path.resolve(__dirname, 'app/bower_components/es6-promise/dist/es6-promise'),
			fxaCheckbox: path.resolve(__dirname, 'app/bower_components/fxa-checkbox/checkbox'),
			fxaClient: 'fxa-js-client/client/FxAccountClient',
			fxaCryptoDeriver: path.resolve(__dirname, 'app/bower_components/fxa-crypto-relier/dist/fxa-crypto-relier/fxa-crypto-deriver'),
			jquery: path.resolve(__dirname, 'app/bower_components/jquery/dist/jquery'),
			'jquery-simulate': path.resolve(__dirname, 'app/bower_components/jquery-simulate/jquery.simulate'),
			// jwcrypto is used by the main app and only contains DSA
			// jwcrypto.rs is used by the unit tests to unbundle and verify
			// assertions, which require RSA.
			jwcrypto: path.resolve(__dirname, 'app/scripts/vendor/jwcrypto/jwcrypto.ds'),
			'jwcrypto.rs': path.resolve(__dirname, 'app/scripts/vendor/jwcrypto/jwcrypto.rs'),
			mailcheck: path.resolve(__dirname, 'app/bower_components/mailcheck/src/mailcheck'),
			md5: path.resolve(__dirname, 'app/bower_components/js-md5/src/md5'),
			mocha: 'mocha/mocha',
			modal: path.resolve(__dirname, 'app/bower_components/jquery-modal/jquery.modal'),
			raven: path.resolve(__dirname, 'app/bower_components/raven-js/dist/raven'),
			sinon: path.resolve(__dirname, 'app/bower_components/sinon/index'),
			'touch-punch': path.resolve(__dirname, 'app/bower_components/jquery-ui-touch-punch/jquery.ui.touch-punch'),
			'ua-parser-js': path.resolve(__dirname, 'app/bower_components/ua-parser-js/src/ua-parser'),
			uuid: path.resolve(__dirname, 'app/bower_components/node-uuid/uuid'),
			vat: path.resolve(__dirname, 'app/bower_components/vat/vat'),
			webrtc: path.resolve(__dirname, 'app/bower_components/webrtc-adapter/adapter')
		}
	},

	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: path.resolve(__dirname, 'app'),
				enforce: 'pre',
				use: 'source-map-loader'
			},
			{
				test: /\.mustache$/,
				loader: 'fxa-mustache-loader'
			}
		]
	},
	plugins: ([
		new webpack.NoEmitOnErrorsPlugin(),
		new webpack.NamedChunksPlugin(),
		new webpack.optimize.CommonsChunkPlugin({
			chunks: ["app", "test", "testDependencies"],
			name: "appDependencies",
			minChunks: Infinity,
		}),
	]).concat(ENV === 'production' ? [
		{
			test: /\.jsx?$/,
			exclude: /(node_modules|bower_components|vendor)/,
			use: 'babel-loader'
		},
		new SriPlugin({
			hashFuncNames: ['sha512'],
			enabled: true,
		}),
		new webpack.optimize.UglifyJsPlugin({
			output: {
				comments: false
			},
			compress: {
				unsafe_comps: true,
				properties: true,
				keep_fargs: false,
				pure_getters: true,
				collapse_vars: true,
				unsafe: true,
				warnings: false,
				screw_ie8: true,
				sequences: true,
				dead_code: true,
				drop_debugger: true,
				comparisons: true,
				conditionals: true,
				evaluate: true,
				booleans: true,
				loops: true,
				unused: true,
				hoist_funs: true,
				if_return: true,
				join_vars: true,
				cascade: true,
				drop_console: true
			},
			sourceMap: true
		}),
	] : []).concat(ENV === 'development' ? [
		new webpack.optimize.CommonsChunkPlugin({
			chunks: ["test"],
			name: "testDependencies",
			minChunks: Infinity,
		})
	]: []),

	stats: { colors: true },

	node: {
		global: true,
		process: false,
		Buffer: false,
		__filename: false,
		__dirname: false,
		setImmediate: false
	},

	// See https://webpack.js.org/configuration/devtool/ to
	// configure source maps to personal preferences.
	devtool: 'source-map'
};
if (ENV === 'development') {
	Object.assign(module.exports.entry, {
		test: '../tests/webpack.js',
		testDependencies: [
			'chai',
			'jquery-simulate',
			'mocha',
			'sinon',
		]
	});
}
/* eslint-enable */