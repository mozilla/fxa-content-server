/* eslint-disable */
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const SriPlugin = require('webpack-subresource-integrity');

const path = require('path');
const ENV = process.env.NODE_ENV || 'development';

module.exports = {
	context: path.resolve(__dirname, 'app/scripts'),

	entry: {
		appDependencies: [
			'backbone',
			'canvasToBlob',
			'cocktail-lib',
			'draggable',
			'duration',
			'es6-promise',
			'fxaCheckbox',
			'jquery',
			'jwcrypto',
			'jwcrypto.rs',
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

		fxaClient: [
			'fxaClient'
		],

		fxaCryptoDeriver: [
			'fxaCryptoDeriver'
		],

		testDependencies: [
			'chai',
			'jquery-simulate',
			'mocha',
			'sinon',
		]
	},

	output: {
		filename: '[name].dll.js',
		path: path.resolve(__dirname, 'app'),
		library: '[name]'
	},

	plugins: [
		new webpack.DllPlugin({
			name: '[name]',
			path: path.join(path.resolve(__dirname, 'app'), '[name].json')
		})
	],

	resolve: {
		extensions: ['.js'],
		modules: [
			path.resolve(__dirname, 'app/scripts'),
			path.resolve(__dirname, 'app'),
			path.resolve(__dirname, 'node_modules'),
			'node_modules'
		],
		alias: {
			backbone: path.resolve(__dirname, 'app/bower_components/backbone/backbone'),
			canvasToBlob: path.resolve(__dirname, 'app/bower_components/blueimp-canvas-to-blob/js/canvas-to-blob'),
			chai: path.resolve(__dirname, 'app/bower_components/chai/chai'),
			'cocktail-lib': path.resolve(__dirname, 'app/bower_components/cocktail/Cocktail'),
			draggable: path.resolve(__dirname, 'app/bower_components/jquery-ui/ui/draggable'),
			duration: path.resolve(__dirname, 'app/bower_components/Duration.js/duration'),
			'es6-promise': path.resolve(__dirname, 'app/bower_components/es6-promise/dist/es6-promise'),
			fxaCheckbox: path.resolve(__dirname, 'app/bower_components/fxa-checkbox/checkbox'),
			fxaClient: path.resolve(__dirname, 'node_modules/fxa-js-client/client/FxAccountClient'),
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
			mocha: path.resolve(__dirname, 'app/bower_components/mocha/mocha'),
			modal: path.resolve(__dirname, 'app/bower_components/jquery-modal/jquery.modal'),
			moment: path.resolve(__dirname, 'app/bower_components/moment/moment'),
//			mustache: path.resolve(__dirname, 'app/bower_components/mustache/mustache'),
			raven: path.resolve(__dirname, 'app/bower_components/raven-js/dist/raven'),
			sinon: path.resolve(__dirname, 'app/bower_components/sinon/index'),
			'touch-punch': path.resolve(__dirname, 'app/bower_components/jquery-ui-touch-punch/jquery.ui.touch-punch'),
			'ua-parser-js': path.resolve(__dirname, 'app/bower_components/ua-parser-js/src/ua-parser'),
			uuid: path.resolve(__dirname, 'app/bower_components/node-uuid/uuid'),
			vat: path.resolve(__dirname, 'app/bower_components/vat/vat'),
			webrtc: path.resolve(__dirname, 'app/bower_components/webrtc-adapter/adapter')
		}
	}
};

/* eslint-enable */