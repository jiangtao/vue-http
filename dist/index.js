'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function plugin(Vue, opts) {
    var http = _axios2.default.create();

    opts = (0, _assign2.default)({}, {
        root: '',
        headers: {},
        loading: noop,
        timeout: 20000,
        duration: 1000,
        timestamp: false,
        credentials: false,
        validateStatus: null,
        autoFixedError: true,
        error: function error(message) {
            alert(message);
        }
    }, opts);

    http.defaults.baseURL = opts.root;
    http.defaults.headers = opts.headers;
    http.defaults.timeout = opts.timeout;
    http.defaults.duration = opts.duration;
    http.defaults.withCredentials = opts.credentials;
    http.defaults.validateStatus = opts.validateStatus;

    requestTimeoutHandler(http, opts);
    requestLoadingHandler(http, opts);
    requestTimestampHandler(http, opts);
    requestRepeatHandler(http, opts);
    // requestFailedHandler(http, opts)

    if (opts.autoFixedError) {
        responseStatusHandler(http, opts);
    }

    Vue.http = http;
    Vue.prototype.$http = http;
}

function requestFailedHandler(http, opts) {
    http.interceptors.request.use(function (config) {
        var onLine = true;

        if (window.navigator.onLine !== undefined) {
            onLine = window.navigator.onLine;
        }

        if (config.onLine !== undefined) {
            onLine = config.onLine;
        }

        if (!(config.onLine = onLine)) {
            opts.error('网络超时');
        }

        return config;
    });
}

function requestTimeoutHandler(http, opts) {
    http.interceptors.response.use(function (res) {
        return res;
    }, function (err) {
        if (err.code === 'ECONNABORTED' || err.message === 'Network Error') {
            return _promise2.default.resolve({ config: err.config, status: 601, statusText: '网络超时' });
        }
    });
}

function requestLoadingHandler(http, opts) {
    http.interceptors.request.use(function (config) {
        config.loadingTimeout = 0;
        config.loadingShow = false;

        // if(!config.onLine) {
        //     return config
        // }

        if (config.duration !== 0) {
            config.loadingTimeout = setTimeout(function () {
                opts.loading(config.loadingShow = true);
            }, config.duration);
        }

        return config;
    });

    http.interceptors.response.use(function (res) {
        clearTimeout(res.config.loadingTimeout);

        if (res.config.loadingShow) {
            opts.loading(res.config.loadingShow = false);
        }

        return res;
    });
}

function requestTimestampHandler(http, opts) {
    http.interceptors.request.use(function (config) {
        // if(!config.onLine) {
        //     return config
        // }

        if (config.method.toLowerCase() === 'get' && opts.timestamp) {
            config.url = '' + config.url + (config.url.indexOf('?') < 0 ? '?' : '&') + 't=' + Date.now();
        }

        return config;
    });
}

function requestRepeatHandler(http, opts) {
    var cache = [];

    http.interceptors.request.use(function (config) {
        config.requestId = '';

        // if(!config.onLine) {
        //     return config
        // }

        if (config.method.toLowerCase() === 'get') {
            config.requestId = '' + config.method.toLowerCase() + config.url + (config.params ? (0, _stringify2.default)(config.params) : '');
        }

        if (config.method.toLowerCase() === 'post') {
            config.requestId = '' + config.method.toLowerCase() + config.url + (config.data ? (0, _stringify2.default)(config.data) : '');
        }

        if (cache.indexOf(config.requestId) === -1) {
            cache.push(config.requestId);
        } else {
            console.error('The last request was in the pending state, not to send multiple requests');
            return new _promise2.default(noop);
        }

        return config;
    });

    http.interceptors.response.use(function (res) {
        cache.splice(cache.indexOf(res.config.requestId), 1);
        return res;
    });
}

function responseStatusHandler(http, opts) {
    http.interceptors.response.use(function (res) {
        if (res.status === 601) {
            return new _promise2.default(opts.error.bind(null, res.statusText));
        }
        /*
        if (`${res.status}`.charAt(0) === '4') {
            return new Promise(opts.error.bind(null, '请求资源不存在'))
        }
        */
        if (('' + res.status).charAt(0) === '5') {
            return new _promise2.default(opts.error.bind(null, '服务器繁忙，请稍后再试'));
        }

        return res;
    });
}

function noop() {}

exports.default = plugin;