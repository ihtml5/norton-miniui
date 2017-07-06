/*
 base.js 基于miniui和jquery的高级封装
 */

(function(root, factory) {
    // 生成ebapBase
    var ebapBase = factory();
    root.ebapBase = ebapBase || {};

    // umd格式
    if (typeof define === 'function' && define.amd) {
		define(function () {
			return ebapBase;
		})
	} else if (typeof exports === 'object') {
		if (module !== 'undefined' && module.exports) {
			exports = module.exports = ebapBase;
		}
		exports.ebapBase = ebapBase;
	}
})(typeof window === 'object' && window, function () {
    // 快捷方法
    var nativeToString = Object.prototype.toString;
    var nativeSlice = Array.prototype.slice;
    var nativeHasOwn = Object.prototype.hasOwnProperty;

    var ebapBase = (function() {
    var ebapModules = {};
    var ebapInstance = null;
    var isParsed = false;
    var winLoc = window.location;
    var winLocSearch = winLoc.search;
    var guid = 0;
    var win = window;
    var commonCfg = {
    };
    var topices = {};
    var localCfg = {
        'url': '当前页面地址:',
        'key': '错误配置的key:',
        'modules': '模块详情:'
    }
    /*
     配置文件
     * */
    var config = {
        root: window['ctx'],
        injectRules: {
            'normal': function() {
                rules['mixin'][0][rules.method]();
            },
            'ifelse': function(rules) {
                if (rkFlist.mode = 'line-add') {
                    rules['mixin'][0][rules.method]();
                } else {
                    rules['mixin'].forEach(function(i, f) {
                        if (i >= 1) {
                            f[rules.method]()
                        }
                    });
                }
            },
            'combine': function() {
                rules['mixin'].forEach(function(i, f) {
                    f[rules.method]()
                });
            }
        },
        uiLib: 'mini',
        nameSpace: 'ebap',
        enableList: {
            open: true,
            decode: true,
            encode: true,
            utils: {
            },
            lock: ['get', 'created']
        },
        $$type: '',
        openFilterRules: ['onload', 'ondestroy']
    };
    var _params = {}
    // 判断某个环境下是否存在某个库是否支持某个方法
    function support(libName,funcName,context) {
        var __context = context ? context : window;
        return (typeof __context[libName] !=='undefined') && __context[libName][funcName];
    }
    // 判断miniui是否支持某个方法
    function miniSupport(methodName,options) {
        if (config.uiLib === 'mini' && support('mini', 'get')) {
            if ( methodName === 'form' ) {
                return new mini.Form(options.id)
            } else if (methodName === 'tooltip') {
                return new mini.ToolTip();
            } else if (methodName === 'contextMenu') {
                return new mini.contextMenu();
            }
        }
        return support(config.uiLib, methodName);
    }
    /**
     * 执行某个对象上的某个方法，也可以注入参数
     * @param {node} elm
     * @param {string} method
     * @returns
     */
    function _execute(elm,method) {
        var _method = method;
        var arg = Array.prototype.slice.call(arguments,2);
        return elm[_method] && elm[_method].apply(this,arg);
    }
    /**
     * 判断某个特定的dom元素是否存在
     * @param {any} elm
     * @param {any} targetInfo
     * @returns
     */
    function _isExistTarget(elm,targetInfo) {
        if (elm.tagName.toUpperCase() === targetInfo.tagName.toUpperCase() && elm.className.indexOf(targetInfo.cls) !== -1 || elm.id === targetInfo.id) {
            return true;
        }
        return false
    }
    /**
     * 事件代理
     * @param {domNode} proxyNode
     * @param {object} targetInfo
     * @param {function} callback
     * @param {string} eventType
     */
    function _eventProxy(proxyNode, targetInfo, callback, eventType) {
        var proxyArgs = [].slice.call(arguments);
        var proxyNode = proxyNode;
        var targetInfo = targetInfo;
        var eventType = eventType || 'click';
        var callback = callback;
        if (proxyArgs.length === 1 && nativeToString.call(proxyArgs[0]) === '[object Object]') {
            proxyNode = proxyArgs[0].context;
            targetInfo = {
                cls: proxyArgs[0].cls,
                tagName: proxyArgs[0].tagName,
                id: proxyArgs[0].id
            };
            eventType = proxyArgs[0].eventType || 'click';
            callback = proxyArgs[0].cb;
        }
        proxyNode.on(eventType, function(e) {
            if (e.target.tagName === 'A' && targetInfo.tagName === 'a') {
                e.preventDefault();
            }
            if (_isExistTarget(e.target, targetInfo)) {
                targetInfo = $.extend({}, targetInfo, { level: 0, dom: e.target});
                callback(targetInfo);
                return undefined
            }
            $(e.target).parents(proxyNode).each(function(idx,elm) {
                if (_isExistTarget(elm, targetInfo)) {
                    targetInfo = $.extend({}, targetInfo, { level: idx+1,dom: e.target});
                    callback(targetInfo)
                    //忽略后续的比较 跳出each函数 from http://www.jb51.net/article/50711.htm
                    return false;
                }
            });
        })
    }
    /**
     * 说明: 自动获取指定区域的input,textarea的值并将其加入到bccparams
     * @param  {jquery object} $els
     * @param {object} bccparams
     **/
    function autoInput($els, ebapparams) {
        $els.on('input', function(event) {
            if (event.target.value.length === 0) {
                delete ebapparams[event.target.name];
            } else {
                ebapparams[event.target.name] = event.target.value;
            }
        });
        if (document.all) {
            $els.each(function() {
                var that = this;
                if (this.attachEvent) {
                    this.attachEvent('onpropertychange', function(e) {
                        if (e.propertyName != 'value') return;
                        $(that).trigger('input');
                    });
                }
            });
        }
    };
    /**
     * 说明: 对multiselect组件onchange事件的封装
     * @param {object} options
     * @param {boolean} checked
     * @param {element} select
     * @param {object} bccparams
     **/
    function multiChangeHandler(option, checked, key, ebapparams) {
        var _multiKey = key
        if (checked) {
            ebapparams[_multiKey] = option[0].value;
        } else {
            ebapparams[_multiKey] = '';
        }
    }
    // 初始化设置
    function  setUp (func) {
        typeof func === 'function' && func.apply(null, nativeSlice.call(arguments, 1));
        return this;
    }
    var _cacheEbapIns = null;
    /**
     * 说明: 项目常用的工具方法
     **/
    // https://github.com/goatslacker/get-parameter-names/blob/master/index.js
    // 看不懂正则的，可以上https://regexper.com
    function getParameterNames(fn) {
        var COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
        var DEFAULT_PARAMS = /=[^,]+/mg;
        var FAT_ARROWS = /=>.*$/mg;
        var code = fn.toString()
            .replace(COMMENTS, '')
            .replace(FAT_ARROWS, '')
            .replace(DEFAULT_PARAMS, '');

        var result = code.slice(code.indexOf('(') + 1, code.indexOf(')'))
            .match(/([^\s,]+)/g);

        return result === null
            ? []
            : result;
    }
    // 对object单个或多个key进行分析,分析完成后，执行相应的回调
    function getAllOptions(options) {
        return function (path, func, defaultOpts) {
            var optionsStrToArr = [];
            var result = null;
            var defaultValue = null;
            var oLen = null;
            if (path && typeof path === 'string' && path.length > 0) {
                if (typeof path === 'string') {
                    optionsStrToArr = path.split('.');
                    oLen = optionsStrToArr.length;
                }
                for (var _index=0;_index< oLen; _index++) {
                    if (result) {
                        result = result[optionsStrToArr[_index]];
                    } else {
                        result = options[optionsStrToArr[_index]];
                    }
                }
                if (func && typeof func === 'function') {;
                    defaultValue = func.call(null, result, defaultOpts);
                } else {
                    defaultValue = func;
                }
                return result || defaultValue;
            } else if (nativeToString.call(path) === '[object Array]') {
                var plen = path.length;
                var pstr = '';
                var pResult = [];
                for (var p = 0; p <plen; p++) {
                    pstr = path[p];
                    result = null;
                    if (typeof pstr === 'string') {
                        optionsStrToArr = pstr.split('.') || [];
                        oLen = optionsStrToArr.length || 0;
                    }
                    for (var _index = 0;_index< oLen; _index++) {
                        if (result) {
                            result = result[optionsStrToArr[_index]];
                        } else {
                            result = options[optionsStrToArr[_index]];
                        }
                    }
                    pResult.push(result);
                }
                pResult.push(defaultOpts, path);
                if (func && typeof func === 'function') {
                    defaultValue = func.apply(null, pResult);
                } else {
                    defaultValue = func;
                }
                return pResult || defaultValue;
            }
        }
    }
    var utilsPool = {};
    // pubsub模式消息通信，参考https://github.com/mroderick/PubSubJS
    var customEventIndex = -1;
    var pubsub = {
        _on: function (topic, cb, context) {
            if (!topices[topic]) {
                topices[topic] = [];
            }
            // 生成唯一的token，便于后期取消
            var token = config.nameSpace + '-uid-' + (customEventIndex++);
            topices[topic].push({
                context: context,
                cb: cb,
                token: token
            });
            return token;
        },
        _clearAll: function () {
            topices = {};
        },
        _clear: function (topic) {
            if (topices[topic]) {
                delete topices[topic]
            }
        },
        _off: function (value) {
            var descendantTopicExists = function (topic) {
                for (var t in topices) {
                    if (nativeHasOwn.call(topices, t) && t.indexOf(topic) === 0) {
                        return true;
                    }
                }
                return false;
            };
            var isTopic = typeof value === 'string' && (nativeHasOwn.call(topices, value) || descendantTopicExists(value));
            var isToken = !isTopic && typeof value === 'string';
            var isFunction = typeof value === 'function';
            var t = null;
            var result = true;
            var topic = null;
            if (isTopic) {
                pubsub._clear(value);
                return;
            }
            for (t in topices) {
                if (nativeHasOwn.call(topices, t)) {
                    topic = topices[t];
                    for (var i = 0, tl= topic.length; i < tl; i++) {
                        if (isToken && topic[i].token === value) {
                            topic.splice(i, 1);
                            result = value;
                        } else if (isFunction && topic[i].cb === value) {
                            topices[t].splice(i, 1);
                            result = true;
                        } 
                    }
                }
            }
            return result;
		},
        _once: function (topic, cb) {
            if (!topices[topic]) {
                topices[topic] = [];
            } 
            topices[topic].push({
                context: this,
                cb: cb,
                once: true
            })
        },
        _trigger: function (topic, data, async) {
            if (!nativeHasOwn.call(topices, topic)) {
                return;
            }
            function throwException (ex) {
                return function rethrowException() {
                    throw ex;
                }
            }
            function callSubscriberWithExceptions( subscriber, data, async ) {

                function emitSubscribe(data) {
                    if (subscriber.cb) {
                        subscriber.cb.call(subscriber.context, data);
                    }
                    if (subscriber.once) {
                        subscriber.cb = function () {}
                    }
                }

                if (async === true) {
                    try {
                        emitSubscribe(data);
                    } catch (err) {
                        setTimeout(throwException(err), 0);
                    }
                }

                emitSubscribe(data);
            }

            function distributeMsg () {
                if (nativeHasOwn.call(topices, topic)) {
                    var subscribers = topices[topic];
                    var cbLen = subscribers.length;
                    for (var i = 0 ; i < cbLen; i++) {
                        callSubscriberWithExceptions(subscribers[i], data, async);
                    }
                }
            }
            if (async === true) {
                setTimeout(distributeMsg, 0);
            } else {
                distributeMsg();
            }
            return true;
        }
    }
    var utils = {
        actionTypes: ['ebap-tbActionAdd','ebap-tbActionDelete','ebap-tbActionModify','ebap-tbActionAssign','ebap-actionType'],
        toggleEnable: function(obj) {
            $.extend(config['enableList'], obj);
        },
        // 错误信息提示
        invarint: function (info, type) {
            for (var i in info) {
                console[type || 'error'](localCfg[i], info[i]);
            }
        },
        now: function() {
            return new Date();
        },
        throttle: function (func, wait, options) {
            var context = null;
            var timeId = null;
            var args = null;
            var previous = 0;
            var result = null;
            var later = function () {
                previous = options.leading === true ? 0 : utils.now();
                timeId = null;
                result = func.apply(context, args);
                if (!timeId) {
                    context = args = null;
                }
            }
            return function () {
                var now = utils.now();
                args = arguments;
                if (!previous || options.leading === false) {
                    previous = utils.now();
                }
                var remaining = wait - (now - previous);
                if (remaining < 0 || remaining> wait) {
                    if (timeId) {
                        clearTimeout(timeId);
                        timeId = null;
                    }
                    result = func.apply(context, args);
                    if (!timeId) {
                        context = args = null;
                    }
                } else if (!timeId && options.trailing  !== false) {
                    timeId = setTimeout(later, remaining);
                }
                return result;
            }
        },
        getNormalDate: function (time) {
            var startTime = null;
            if (typeof startTime === 'number') {
                startTime = new Date(time);
            } else if (typeof startTime === 'string') {
                startTime = new Date(Date.parse(time));
            }
            return startTime;
        },
        setParams: function(key, value) {
            if (key && nativeToString.call(key) == '[object Object]') {
                $.each(key, function(m, ms) {
                    if (m && ms) {
                        _params[m] =  ms;
                    }
                })
            } else {
                if (key) {
                    _params[key] = value;
                }
            }
        },
        getParams: function (key) {
            if (key && _params[key]) {
                return _params[key];
            }
        },
        hasKeys: function (obj) {
            if (typeof obj === 'object' && !!obj && nativeToString.call(obj) === '[object Object]') {
                for (var o in obj) {
                    if (nativeHasOwn.call(obj, o)) {
                        return true;
                    }
                }
            }
            return false;
        },
        hasAndReturnGetTime: function (time) {
            return time && time.getTime && typeof time.getTime === 'function';
        },
        computeDelta: function (startTime, endTime) {
            var startTime = utils.getNormalDate(startTime);
            var endTime = utils.getNormalDate(endTime);
            var deltaTime = null;
            if (hasAndReturnGetTime(startTime) && hasAndReturnGetTime(endTime)) {
                var deltaTime = startTime.getTime() - endTime.getTime();//时间差的毫秒数
            }
            deltaTime = Math.abs(deltaTime);
            //计算出相差天数
            var days=Math.floor(deltaTime/(24*3600*1000))
            //计算出小时数
            var leave1=deltaTime%(24*3600*1000);
            //计算天数后剩余的毫秒数
            var hours=Math.floor(leave1/(3600*1000))
            //计算相差分钟数
            var leave2=leave1%(3600*1000);
            //计算小时数后剩余的毫秒数
            var minutes=Math.floor(leave2/(60*1000))
            
            //计算相差秒数
            var leave3=leave2%(60*1000);     
            //计算分钟数后剩余的毫秒数
            var seconds=Math.round(leave3/1000);
            return {
                days: days,
                hours: hours,
                minutes: minutes
            };
        },
        /*
          生成深层依赖分析函数
        */
        genDpo: function (context,opts, options) {
            var po = typeof options === 'object' ? utils.getAllOptions(options) : options;
            if (context && context.genParseOBK && context['$$type'] === config.nameSpace) {
                return context.genParseOBK($.extend(opts || {}, {
                    parseOBK: po
                }))
            }
        },
        // 当获取模块失败时, 提供友好的错误信息提示
        safeGetModule: function (modules, options, moduleSettings) {
            try {
                var moduleIns = utils.getModule(ebapModules, options.key);
                var waitInject = {};
                moduleIns && typeof moduleIns === 'function' && (waitInject['$$type'] = config.nameSpace);
                return $.extend(true, moduleIns($.extend({}, options)), { 
                    setUrls: utils.setUrls, 
                    genParseOBK: utils.genParseOBK,
                    parseOBK: utils.getAllOptions(options),
                    getDepsIns: utils.getDepsIns,
                    extend: utils.extend, 
                    getIns: utils.getIns, 
                    insId: options.key === 'smodules' ? options.id : '', 
                    moduleType: options.mType || options.key, 
                    moduleDeps: options.moduleDeps
                }, moduleSettings, waitInject, pubsub);
            } catch (e) {
                utils.invarint({
                    url: window.location.href,
                    key: options.key,
                    modules: modules
                });
                return;
            }
        },
        // 从列表数据中生成url后缀
        genUrls: function(originData, data, rules) {
            var hasIdFlag = data.indexOf('id=') > -1;
            var hasSearchFlag =  data.indexOf('?') > -1;
            var removeInfo = {};
            var odLen = originData.length;
            for (var i = 0; i < odLen; i++) {
                var r = originData[i];
                $.each(rules, function(i, dt) {
                    if (nativeHasOwn.call(r,dt)) {
                        if (!removeInfo[dt]) {
                            removeInfo[dt] = dt + '='+ r[dt]
                        } else {
                            removeInfo[dt] +=',' +  r[dt]
                        }
                    }
                })
            }
            hasIdFlag && (data += (hasSearchFlag ? removeInfo['id'].slice(3) : '?'+removeInfo['id'].slice(3)));
            for (var rinfo in removeInfo) {
                if (nativeHasOwn.call(removeInfo, rinfo)) {
                    if (hasIdFlag) {
                        rinfo !== 'id' && (data += ('&'+removeInfo[rinfo]))
                    } else {
                        data += (hasSearchFlag ? removeInfo[rinfo] + '&' : '?'+removeInfo[rinfo] + '&');
                    }
                }
            }
            return data;
        },
        doDel: function (originData, data, rules) {
            var data = utils.genUrls(originData, data, rules);
            utils.doListAjax.call(this, data);
        },
        doListAjax: function (url) {
            var self = this;
            utils.ajax({
               url: url,
               success: function (text) {
                   self.getIns().reload();
               },
               error: function () {
               }
            });
        },
        getAllOptions: getAllOptions,
        disable: function (key) {
            var _methodName = key;
            if (utils[_methodName]) {
                config.enableList.utils[_methodName] = false;
            }
        },
        setNameSpace: function (ns) {
            if (!ns) return;
            return config['nameSpace'] = typeof ns === 'string' ? ns: ns.toString();
        },
        setPropTrue: function (obj) {
            if (!$.isPlainObject(obj)) return;
            for (var u in obj) {
                if (nativeHasOwn.call(obj, u) && typeof obj[u] == 'function' && $.inArray(u, config.enableList.lock) == -1) {
                    config.enableList.utils[u] = true;
                }
            }
        },
        // 通过id获取某个miniui实例
        getInstance: function(options, type) {
            var cacheInstance = null;
            if (typeof options === 'string') {
                var options = {
                    id: options
                }
            }
            if (type) {
                cacheInstance = utils.created(options, String(type));
            } else {
                cacheInstance = utils.created(options);
            }
            return cacheInstance;
        },
        get: get,
        genOpenCfg: function(openCfg) {
            var _cfg = {};
            $.each(openCfg, function(i, cfg) {
                if ($.inArray(cfg['filter'] || cfg.openFilterRules, i) > -1) {
                    if (i === 'onload') {
                        _cfg[i] = cfg[i];
                    } else {
                        _cfg[i] = function(action) {
                            action ? cfg[i](action) : cfg[i]();
                        }
                    }
                }
                _cfg[i] = cfg[i];
            })
            return _cfg;
        },
        open: function(openCfg) {
            console.log(":::openCfg", openCfg);
            // var newOpenCfg = utils.genOpenCfg(openCfg);
            miniSupport('open')(openCfg);
        },
        genDepsIns: function (deps,flag) {
            var _deps = {};
            var deps = (deps && deps.length>=0) ? deps : [];
            var depsKey = '';
            for (var d = 0, dl = deps.length; d < dl; d++) {
                depsKey = deps[d].key.split('.').join('');
                if (flag) {
                    _deps[depsKey] = utils.getInstance(deps[d])
                } else {
                    _deps[depsKey] = utils.get(deps[d])
                }
            }
            return _deps;
        },
        created: function(options, methodName) {
            var _cacheEbapIns = null;
            if (typeof methodName === 'string' && methodName === 'form') {
                _cacheEbapIns = miniSupport('form', options);
            } else {
                _cacheEbapIns = miniSupport('get')(options.id);
            }
            if (_cacheEbapIns) {
                options['created'] && typeof options['created'] === 'function' && options['created'](_cacheEbapIns, options.moduleDeps)
            }
            return _cacheEbapIns;
        },
        seekOptions: function(options, ins) {
            for (var o in options) {
                if (typeof options[o] === 'function') {
                    options[o](ins);
                }
            }
        },
        isAandHasCls:function(target,clsStr,strategy) {
            return target.tagName === 'A' && $(target).hasClass(clsStr) && clsStr === strategy;
        },
        // 自动绑定事件,并执行相应的策略,用于表格中事件处理
        extendInjectRules: function (rule) {
            if ($.isPlainObject(rule)) {
                for (var r in rule) {
                    if (nativeHasOwn.call(rule, r)) {
                        config.injectRules[r] = rule[r]
                    }
                }
                return true;
            }
            return false;
        },
        // 动态加载脚本
        loadScript: function(src, cb, func) {
            var spt = null;
            if (typeof src === 'string') {
                spt = document.createElement('script');
                spt.charset="utf-8";
                spt.src = src;
                spt.onload = spt.onreadystatechange =  function(e) {
                    if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
                        cb(e);
                        spt.onload = spt.onreadystatechange = null;
                    }
                }
                func(spt);
            } else if (nativeToString.call(src) === '[object Array]') {
                var slen = src.length;
                var count = slen;
                var argsArr = [];
                for (var i = 0; i< slen; i++) {
                    spt = document.createElement('script')
                    spt.charset="utf-8";
                    spt.src = src[i];
                    spt.onload = spt.onreadystatechange =  function(e) {
                        argsArr.push(e);
                        if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
                            count--;
                            if (!count) {
                                cb(argsArr);
                            }
                            spt.onload = spt.onreadystatechange = null;
                        }
                    }
                    func(spt);
                }
            }
        },
        eventProxy: _eventProxy,
        autoProxyTrigger: function(cfg) {
            for (var icfg in cfg) {
                if (nativeHasOwn.call(cfg, icfg)) {
                    this.eventProxy({
                        context: cfg[icfg].context,
                        cls: icfg,
                        tagName: cfg[icfg].tagName,
                        eventType: cfg[icfg].eventType,
                        cb:  cfg[icfg].cb
                    });
                }
            }
        },
        getIns: function() {
            var insId = this.insId || '';
            var moduleType = this.moduleType;
            if (!insId) {
                return this;
            }
            return utils.getInstance({ id: insId }, moduleType);
        },
        setCommonCfg: function(obj, deep) {
            var parseOBK = getAllOptions(obj);
            var cdArr = null;
            var cdLen = null;
            $.each(commonCfg.disable, function(index, cd) {{
                if (parseOBK(cd) != null) {
                    cdArr = cd.split('.');
                    cdLen = cdArr.length;
                    if (cdLen === 1) {
                        delete obj[cdArr[0]];
                    } else if (cdLen === 2) {
                        delete obj[cdArr[0]][cdArr[1]];
                    } else if (cdLen === 3) {
                        delete obj[cdArr[0]][cdArr[1]][cdArr[2]];
                    }
                }
            }
            });
            commonCfg = $.extend(deep ? deep : true,commonCfg, obj);
        },
        getCommonCfg: function () {
            return commonCfg;
        },
        hackIe: function (verStr, func) {
            if ($.inArray(verStr.split(','), document.documentMode.toString()) !== -1) {
                func.apply(null, nativeSlice.call(arguments).length>2 && nativeSlice.call(arguments, 2))
            }
        },
        inject: function(options) {
            return function() {
                config.injectRules[options.rule](options.mixin)
            }
        },
        extend: function () {
            var _extendObj = {};
            $.each( Array.prototype.slice.call(arguments), function(i, arg) {
                _extendObj = $.extend(_extendObj, arg);
            })
            $.extend(this, _extendObj);
            return this;
        },
        //获取字典标签 ebapBase.utils.getDictLabel
        getDictLabel: function getDictLabel(data, value, defaultValue){
            for (var i=0; i<data.length; i++){
                var ebapDictRows = data[i];
                if (ebapDictRows.value == value){
                    return ebapDictRows.label;
                }
            }
            return defaultValue;
        },
        genParseOBK: function (opts) {
            // 获取当前options分析
            var parseOBK = opts.parseOBK;
            // 从参数形成新的options
            var _parseOBK = ebapUtils.getAllOptions(opts || {});
            var parseResult = [];
            return function(longPath,defaultValue) {
                var _args = [].slice.call(arguments);
                // console.clear();
                if (typeof longPath === 'string') {
                    var _key = longPath.split('.').length>=2 ? longPath.split('.').slice(1).join('.') : longPath.split('.').slice()[0] || '';
                    return _parseOBK(_key, function(result) {
                        if (result) {
                            if (typeof defaultValue === 'function') {
                                defaultValue(result,_args[2]);
                            }
                        } else {
                            return parseOBK(longPath, defaultValue, _args[2]);
                        }
                    });
                } else if (nativeToString.call(longPath) === '[object Array]') {
                    var len = longPath.length;
                    for (var l = 0; l< len; l++) {
                        var lstr = longPath[l];
                        var _key = lstr.split('.').length>=2 ? lstr.split('.').slice(1).join('.') : lstr.split('.').slice()[0] || '';
                        var _result = _parseOBK(_key, function(result) {
                            if (result) {
                                return result;
                            } else {
                                return parseOBK(lstr);
                            }
                        });
                        parseResult.push(_result);
                    }
                    parseResult.push( _args[2], longPath);
                    if (typeof defaultValue === 'function') {
                        defaultValue.apply(null, parseResult);
                    }
                    return parseResult;
                }
            }
        },
        autoInput: autoInput,
        // 设置实例的urls
        setUrls: function(obj) {
            console.log(obj);
            if (nativeToString.call(obj) === '[object Object]') {
                for ( var ukType in obj) {
                    if (ukType.toLowerCase().slice(-3) === 'url') {
                        this.settings && (this.settings[ukType] = utils.prefixPath(obj[ukType]));
                    } else {
                        this.settings && (this.settings[ukType + 'Url'] = utils.prefixPath(obj[ukType]));
                    }
                }
            }
        },
        resetRoot: function (root) {
            root && (config['root'] = root);
        },
        // 判断miniui是否支持编码
        encode: support('mini', 'encode') ?support('mini', 'encode') : function () {},
        // 判断miniui是否支持解码
        decode:support('mini', 'decode')? support('mini', 'decode') : function () {},
        clone: support('mini', 'clone') ? support('mini', 'clone'): function () {},
        // 自动为url加入根路径ctx
        prefixPath: function (url, ctx) {
            return typeof config.root !== 'undefined' ? config.root + (url || '') : ( url || '')
        },
        isString: function (str) {
            return typeof str === 'string' && str;
        },
        isSupportStoreByType: function (type) {
            var storeMap = {
                'session': window.sessionStorage,
                'local': window.localStorage,
                'cookie': document.cookie
            }
            return storeMap[utils.isString(type).toLowerCase()];
        },
        getModule: function (ns, ns_string) {
            var parts = ns_string.split('.');
            var parent = ns;
            var pl = parts.length;
            var exportModule = null;
            for (var i = 0; i < pl; i++) {
                if (!exportModule) {
                    exportModule = parent[parts[i]];
                } else {
                    exportModule = exportModule[parts[i]];
                }
            }
            return exportModule;
        },
        // 封装ajax进行更多控制
        ajax: function (options) {
            var ajaxOpts = $.extend({
                contentType: "application/json",
                dataType: 'json',
                cache: false,
                success: function ( data, textStatus, jqXHR ) {
                    options.success && options.success(data, textStatus, jqXHR);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    options.error && (options.error(jqXHR, textStatus, errorThrown));
                }
            }, options);
            $.ajax(ajaxOpts);
        },
        // 通用的交互操作
        actions: {
            close: function (action, ebapFormIns, context ,data) {
                if (action == 'close' && ebapFormIns.isChanged()) {
                    if (confirm("数据被修改了，是否先保存？")) {
                        return false;
                    }
                }
                if (window.CloseOwnerWindow) {
                    return window.CloseOwnerWindow(action);
                } else {
                    window.close();
                }
            }
        },
        support: support,
        miniSupport: miniSupport
    };
    var ebapUtils = utils;
    // 如果页面超时，将页面重置到登录页
    function loginOut(url) {
        if (winLocSearch.length === 0 && win == win.parent) {
            win.location.herf = utils.prefixPath(url);
        } else if (winLocSearch.length === 0 && win != win.parent) {
            win = win.top;
            win.location.reload();
        }
    }
    /*
     *  登入登出控制
     * */
    var ebapLogin = function (options) {
        var loginUrl = options.url || '/a/login';
        var self = {
            out: function() {
                loginOut(loginUrl);
            }
        }
        return self;
    }

    /*
     *  自定义弹出框通用逻辑
     *
     * */

    var ebapModal = function (options) {
        var detailInfoState = {
            cur: '0',
            '0': '收起详情',
            '1': '查看详情'
        };
        var tplCfg = $.extend({},
            {
                desc: '',
                detailInfo: ''
            },
            options.tplCfg
        );
        var modalState = 'show';
        var selector = options.selector || '.ebap-maskContainer';
        var context = options.context || document;
        //<button class="btn btn-warning ebap-modal-closeBtn"><i class="fa fa-power-off"></i>关闭</button>
        var defaultConfirmTpl = function (tplCfg) {
            return (
            '<div class="ebap-maskContainer">'
            + '<div class="ebap-modalCnt">'
            + '<div class="ebap-modal-tips"><div class="ebap-confirmSure ebap-modal-tipsCnt"><i class="fa fa-warning"></i>错误信息提示</div><button class="ebap-btn ebap-btn-warning ebap-modal-closeBtn"><i class="fa fa-power-off"></i>关闭</button></div>'
            + '<div class="ebap-modal-msgDesc ebap-modal-tipsCnt"><p class="ebap-modal-modalDescp">'+ tplCfg.desc+'</p></div>'
            + '<div class="ebap-modal-msgDetail ebap-modal-msgDetailHidden"><h3 class="ebap-modal-errorTitle">详细信息</h3>' + ebapModal.getDetailInfo(tplCfg.detailInfo) + '</div>'
            + '<div class="ebap-modal-actions">'
            + '<button class="ebap-modal-confirmBtn ebap-btn ebap-btn-info"><i class="fa fa-info-circle"></i>查看详情</button></div></div>'
            );
        }
        function clearMask(selector) {

            selector.length>0 && selector.remove();
        }
        function insertModalNode(context, tplCnt, selector, func) {
            if ( $('body', context).eq(0).find('script').length>0 ) {
                $('body', context).eq(0).find('script').eq(0).before(tplCnt);
            } else {
                $('body', context).eq(0).append(tplCnt);
            }
            func(selector, context);
        }
        function activeDefaultAction (selector, context) {
            $(selector + ' .ebap-modal-closeBtn', context).click(function(event) {
                $(selector, context).fadeOut();
                modalState = 'hide';
                return false;
            });
            $(selector + ' .ebap-modal-confirmBtn', context).click(function(event) {
                $(selector + ' .ebap-modal-msgDetail', context)[(detailInfoState.cur === '0' ? 'fadeIn' : 'fadeOut')](0);
                if (event.target.tagName.toLowerCase() === 'i') {
                    $(event.target).parent().html('<i class="fa fa-info-circle"></i>' + detailInfoState[detailInfoState.cur]);
                } else {
                    $(event.target).html('<i class="fa fa-info-circle"></i>' + detailInfoState[detailInfoState.cur]);
                }
                detailInfoState.cur === '0' ? detailInfoState.cur = '1' : detailInfoState.cur = '0';
            });
        }
        function genConfirmModalCnt(tplCfg, selector,context) {
            var tplCnt = defaultConfirmTpl(tplCfg);
            insertModalNode(context, tplCnt, selector, activeDefaultAction);
            $(selector + ' .ebap-modal-detailCon', context).css({
                'height': (parseInt($(context).height()*0.48, 10) - 120) + 'px'
            });
            window.top.onresize = function() {
                $(selector + ' .ebap-modal-detailCon', context).css({
                    'height': (parseInt($(context).height()*0.48, 10) - 120) + 'px'
                });
            }
        }

        function showConfirmModal(tplCfg, selector, context) {
            var $selector = $(selector, context);
            clearMask($selector);
            if ($selector.length > 0) {
                modalState = 'show';
                $selector.fadeIn();
            } else {
                genConfirmModalCnt(tplCfg, selector, context);
            }
        }
        showConfirmModal(tplCfg, selector, context);
        return {
            show: function () {
                modalState = 'show';
                $(selector, context).fadeIn();
                return this;
            },
            hide: function () {
                modalState = 'hide';
                $(selector, context).fadeOut();
                return this;
            },
            getState: function() {
                return modalState;
            }
        }
    };
    ebapModal.getDetailInfo = function (info) {
        var _info = [];
        if (Object.prototype.toString.call(info) !== '[object Array]') {
            info = !info ?  [] : [info];
        }
        $.each(info, function(_, ifo) {
            _info.push('<li><span class="ebap-modal-detailName">'+(ifo.name ? ifo.name : '')+(ifo.description && ifo.name ? ':' : '')+'</span><span class="ebap-modal-detailDesc">'+(ifo.description ? ifo.description : '')+'</li>')
        });
        return ('<ol class="ebap-modal-detailCon">'+_info.join('')+'</ol>')
    }
    /**
     * 说明:对miniui tabs组件的封装包括增加,删除，激活,更新tab,以及绑定事件等方法
     * @param  {string} tadId
     * @returns {undefined}
     */
    var ebapTabs = function(options) {
        var ebapTabsIns = ebapUtils.getInstance(options);
        var _tabs = ebapTabsIns.getTabs();
        var _names = [];
        var self = {
            addTab: function(tabCfg, ebapparams) {
                var tabCfg = tabCfg || {};
                var self = this;
                if ($.inArray(tabCfg.name, _names) >-1) {
                    var _activeTab = self.getTab(tabCfg.name);
                    self.activeTab(_activeTab);
                    return undefined;
                } else {
                    self._names.push(tabCfg.name);
                    tabCfg.ondestroy = function (e) {
                        var _ebapTabs = e.sender;
                        var _ebapIframe = _ebapTabs.getTabIFrameEl(e.tab);
                        var pageReturnData = _ebapIframe.contentWindow.getData ? _ebapIframe.contentWindow.getData() : "";
                    }
                    ebapTabsIns.addTab(tabCfg);
                    self.activeTab(tabCfg);
                    return self.getActiveTab();
                }
            },
            getActiveTab: function() {
                return ebapTabsIns.getActiveTab();
            },
            getTab: function(name) {
                var __name = name;
                if (__name) {
                    return  ebapTabsIns.getTab(__name)
                }
                return ebapTabsIns.getActiveTab();
            },
            updateTab: function(tab, tabCfg) {
                ebapTabsIns.loadTab(tabCfg.url, tab);
                ebapTabsIns.updateTab(tab, tabCfg)
            },
            removeTab: function(name) {
                var _name = name;
                var _activeTab = _name ? self.getTab(_name) : self.getActiveTab();
                if (_activeTab) {
                    ebapTabsIns.removeTab(_activeTab);
                    self._names = self._names.splice($.inArray(_name,self._names), 1);
                }
            },
            activeTab: function(name) {
                ebapTabsIns.activeTab(ebapTabsIns.getTab(name))
            },
            on: function(event,func) {
                ebapTabsIns.on(event,func);
            }
        }
        return self;
    };
    /*
     *  表单通用逻辑
     * */
    var ebapForm = function(options) {
        var ebapFormIns = ebapUtils.getInstance(options, 'form');
        var ebapFormUrl = '';
        var ebapFormData = null;
        this.ins = ebapFormIns;
        function _save() {
            ebapFormData = self.getData();
            var _treeSelect = ebapUtils.getInstance('parent-treeselect');
            ebapFormIns.validate();
            if (ebapFormIns.isValid() == false) return;
            ebapFormUrl = self.settings.saveUrl;
            ebapUtils.ajax({
                url: ebapFormUrl,
                type: 'post',
                data: ebapUtils.encode(ebapFormData),
                success: function (data, textStatus, jqXhr) {
                    ebapUtils.actions.close('save', ebapFormIns);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    ebapUtils.actions.close('', ebapFormIns);
                }
            });
        };
        var self = {
            getData: function(formatter, deep) {
                return ebapFormIns.getData(formatter, deep);
            },
            settings: {
                saveUrl: '',
                setUrl: ''
            },
            labelModel: function () {
                var fields = ebapFormIns.getFields();
                for (var i = 0, l = fields.length; i < l; i++) {
                    var c = fields[i];
                    if (c.setReadOnly) c.setReadOnly(true);     //只读
                    if (c.setIsValid) c.setIsValid(true);      //去除错误提示
                    if (c.addCls) c.addCls("asLabel");          //增加asLabel外观
                }
            },
            inputModel: function () {
                var fields = ebapFormIns.getFields();
                for (var i = 0, l = fields.length; i < l; i++) {
                    var c = fields[i];
                    if (c.setReadOnly) c.setReadOnly(false);
                    if (c.removeCls) c.removeCls("asLabel");
                }
                miniSupport('repaint')(document.body);
            },
            setData:function(data, all, deep) {
                ebapFormIns.setData(data, all, deep);
                if (data.action == "edit" ) {
                    data = miniSupport('clone')(data);
                    ebapFormUrl = self.settings.setUrl;
                    ebapUtils.ajax({
                        url: ebapFormUrl,
                        data: {id:data.id},
                        success: function (data, textStatus, jqXhr) {
                            ebapFormIns.setData(ebapUtils.decode(data));
                            ebapFormIns.setChanged(false);
                        }
                    });
                } else if(data.action == 'new') {
                    ebapFormIns.setData(data);
                }
            },
            save: function () {
                ebapFormData = self.getData();
                var _treeSelect = ebapUtils.getInstance('parent-treeselect');
                ebapFormIns.validate();
                if (ebapFormIns.isValid() == false) return;
                ebapFormUrl = self.settings.saveUrl;
                ebapUtils.ajax({
                    url: ebapFormUrl,
                    type: 'post',
                    data: ebapUtils.encode(ebapFormData),
                    success: function (data, textStatus, jqXhr) {
                        ebapUtils.actions.close('save', ebapFormIns);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        ebapUtils.actions.close('', ebapFormIns);
                    }
                });
            },

            onOk: function (e) {
                _save();
            },
            onCancel: function (e) {
                ebapUtils.actions.close('cancel');
            }
        };
        return  self;
    };
    /*
     *  列表通用逻辑
     * */
    var ebapList = function (options) {
        var defaultOptions = {
            showHidden: [{ id: 1, text: '显示' }, { id: 0, text: '隐藏'}],
            openCfg: {
                width: 600,
                height: 400,
                edit: {
                    title: '编辑菜单'
                },
                add: {
                    title: '"新增菜单"'
                }
            }
        };
        var options = $.extend(defaultOptions, options)
        var showHidden = options.showHidden || '';
        var parseOBK = getAllOptions(options);
        var ebapTreeGridIns = ebapUtils.getInstance(options);
        var ebapSelectedRows = null;
        var data = null;
        function getColumns(columns) {
            columns = columns.clone();
            for (var i = columns.length - 1; i >= 0; i--) {
                var column = columns[i];
                if (!column.field) {
                    columns.removeAt(i);
                } else {
                    var c = { header: column.header, field: column.field };
                    columns[i] = c;
                }
            }
            return columns;
        }
        var self = {
            renderers: {
                onShowHidenRenderer: function (e){
                    for (var i = 0, l = showHidden.length; i < l; i++) {
                        var g = showHidden[i];
                        if (g.id == e.value) return g.text;
                    }
                    return "";
                },
                onActionRenderer: function () {}
            },
            settings: {
            },
            onDrawCell: options.onDrawCell || function () {},
            exportAnything: function (opts) {
                var columns = ebapTreeGridIns.getBottomColumns();
                var columns = getColumns(columns);
                var json = ebapUtils.encode(columns);
                document.getElementById("excelData").value = json;
                var excelForm = $("#excelForm");
                excelForm.submit();
            },
            add: function (opts) {
                var deepParseOBK = self.genParseOBK($.extend(opts || {}, {
                    parseOBK: parseOBK
                }));
                var modeUrl = null;
                ebapSelectedRows = ebapTreeGridIns.getSelected();
                data = parseOBK('openCfg.add.data', { action: "new",parentId: ebapSelectedRows && (ebapSelectedRows.id || '')});
                deepParseOBK(['openCfg.add.mode.value', 'openCfg.add.callback', 'openCfg.add.mode.url'], function (value, cb, url) {
                    if (value === 'inline' && cb) {
                        cb({
                            context: null,
                            ins: ebapListIns,
                            deepParseOBK: deepParseOBK
                        });
                    } else {
                        url && (modeUrl = ebapUtils.prefixPath(deepParseOBK(url)));
                    }
                });
                miniSupport('open')({
                    url: modeUrl || self.settings.addUrl ,
                    title: deepParseOBK('openCfg.add.title', '新增菜单'),
                    width: deepParseOBK('openCfg.width', 600),
                    height: deepParseOBK('openCfg.height', 400),
                    onload: function () {
                        var iframe = this.getIFrameEl();
                        deepParseOBK('openCfg.add.callback', function(result) {
                            iframe.contentWindow.ebapForm.setData(data);
                            if (result) {
                                result({
                                    context: iframe.contentWindow,
                                    deepParseOBK: deepParseOBK,
                                    ins: ebapListIns
                                })
                            }
                        });
                    },
                    ondestroy: function (action) {
                        !action.noreload && ebapTreeGridIns.reload();
                        action.cb && action.cb(ebapTreeGridIns, data);
                    }
                });
            },
            search: function (opts) {
                var dpo = utils.genDpo(self, opts, options);
                dpo(['search.keywords', 'search.id', 'search.ajax', 'search.callback', 'search.vlaue'], 
                    function(keywords, id, ajax, cb, value) {
                        var _key = ebapUtils.getInstance(keywords || id).getValue();
                        if (cb && typeof cb === 'function') {
                            cb(_key.length>0 ? _key : (value || ''));
                        } else {
                            ebapTreeGridIns.load({ key: _key});
                        }
                });
            },
            edit: function (opts) {
                var deepParseOBK = self.genParseOBK($.extend(opts || {}, {
                    parseOBK: parseOBK
                }));
                ebapSelectedRows = ebapTreeGridIns.getSelected();
                data = deepParseOBK('openCfg.edit.data', { action: "edit",parentId: ebapSelectedRows && (ebapSelectedRows.id || '')});
                var modeUrl = deepParseOBK('openCfg.edit.mode.url') ? ebapUtils.prefixPath(deepParseOBK('openCfg.edit.mode.url')) : null;
                if (ebapSelectedRows) {
                    miniSupport('open')({
                        url:  modeUrl || self.settings.editUrl,
                        title: deepParseOBK('openCfg.edit.title',"编辑菜单"),
                        width: deepParseOBK('openCfg.width', 600),
                        height: deepParseOBK('openCfg.height',400),
                        onload: function () {
                            var iframe = this.getIFrameEl();
                            var data = { action: "edit", id: ebapSelectedRows.id };
                            deepParseOBK('openCfg.edit.callback', function(result) {
                                iframe.contentWindow.ebapForm.setData(data);
                                if (result) {
                                    result({
                                        context: iframe.contentWindow,
                                        deepParseOBK: deepParseOBK,
                                        data: {

                                        }
                                    });
                                }
                            });
                        },
                        ondestroy: function (action) {
                            ebapTreeGridIns.reload();
                        }
                    });
                } else {
                    alert("请选中一条记录");
                }
            },
            remove: function (opts) {
                var deepParseOBK = self.genParseOBK($.extend(opts || {}, {
                    parseOBK: parseOBK
                }));
                var data = [];
                deepParseOBK('openCfg.remove.data', function(dt) {
                    if (dt) {
                        data = dt;
                        if (data.indexOf('id') == -1) {
                            data.push('id');
                        }
                    } else {
                        data = ['id'];
                    }

                })
                ebapSelectedRows = ebapTreeGridIns.getSelecteds();
                if (ebapSelectedRows.length > 0) {
                    if (confirm("确定删除选中记录？")) {
                        ebapTreeGridIns.loading("操作中，请稍后......");
                        deepParseOBK('openCfg.remove.callback', function(cb) {
                            if (cb && typeof cb == 'function') {
                                cb.call(self, ebapSelectedRows, deepParseOBK);
                            } else {
                                ebapUtils.doDel.call(self, ebapSelectedRows,self.settings.delUrl, data);
                            }
                        });
                    }
                } else {
                    alert("请选中一条记录");
                }
            }
        };
        return self;
    };
    // 集合模块
    var ebapSameModules = function (options) {
        var parseOBK = ebapUtils.getAllOptions(options);
        var allModules = {};
        var baseFields = {}
        parseOBK(['ids', 'count','names', 'mType', 'allOptions'], function(ids, count, names, mType, allOptions) {
            if (!ids) {
                for (var ic = 0; ic < count; ic++) {
                    baseFields['id'] = id;
                    baseFields['key'] = mType;
                    baseFields = $.extend(true, allOptions && allOptions[i] || $.extend(options,{
                        created: null,
                        mounted: null,
                        deps: []
                    }), baseFields);
                    allModules[names[i] || i] = utils.get(baseFields);
                    baseFields = {};
                }
            } else {
                $.each(ids, function (i,id) {
                    baseFields['id'] = id;
                    baseFields['key'] = mType;
                    baseFields = $.extend(true, allOptions && allOptions[i] || $.extend(options,{
                        created: null,
                        mounted: null,
                        deps: []
                    }), baseFields);
                    allModules[names[i] || i] = utils.get(baseFields);
                    baseFields = {};
                });
            }
        })
        var self = {
            get: function (name) {
                return allModules[name];
            }
        }
        return self;
    }
    // ajax 模块
     function ebapAjax (options) {
        var defaultOpts = {
            url: 'http://localhost:3001/users',
            method: 'get',
            data: null,
            success: function (success, status, xhr) {

            },
            complete: function(xhr, status) {

            }
        };
        var options = $.extend(defaultOpts, options);
        var localProtocol = window.location.protocol;
        var rLocalProtocol = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/;
        var isLocal = rLocalProtocol.test(localProtocol);
        function createStandardXHR() {
            try {
                return new window.XMLHttpRequest();
            } catch( e ) {}
        }

        function createActiveXHR() {
            try {
                return new window.ActiveXObject( "Microsoft.XMLHTTP" );
            } catch( e ) {}
        }
        function createXHR() {
            return !isLocal && createStandardXHR() || createActiveXHR();
        }
        var xhr = createXHR();
        var result = null;
        var dataType = null;
        var allResHeaders = null;
        var self = {
            start: function (opts) {
                // 生成深度依赖
                var dpo = utils.genDpo(self, opts, options);
                dpo(['method','success', 'data', 'url', 'dataType'], function(method, successCb, data, url, dataType) {
                    dataType = dataType || 'json';
                    xhr.open(method, url);
                    xhr.setRequestHeader('Cache-Control', 'max-age=3000,public');
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState === 4) {
                            if (xhr.status>= 200 && xhr.status <300 || xhr.status === 304) {
                                if (xhr.getResponseHeader('Content-Type').indexOf('text/json') !== -1 &&dataType === 'json' && JSON.parse ) {
                                    result = JSON.parse(xhr.responseText);
                                } else {
                                    result = xhr.responseText;
                                }
                                successCb(result, xhr.status, xhr);
                            }
                        }
                    }
                    xhr.withCredentials = true;
                    if (method && method === 'post') {
                        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencode')
                    }
                    xhr.send(data || null);
                });
            },
            abort: function () {
                xhr.abort();
            }
        }
        return self;
    }
    // 存储模块
    function ebapStore(options) {
        var parseOBK = ebapUtils.getAllOptions(options);
        var type = parseOBK('storeType');
        var store = ebapUtils.isSupportStoreByType('local');
        var self = {
            get: function (key) {
                if (store && 'sessionlocal'.indexOf(type) !== -1 ) {
                    return store.getItem(key)
                }
            },
            set: function(key, value) {
                console.log('key::::', key, value);
                if (store && 'sessionlocal'.indexOf(type) !== -1 ) {
                    console.dir(store);
                    return store.setItem(key, value);
                }
            },
            remove: function (key) {
                if (store && 'sessionlocal'.indexOf(type) !== -1 ) {
                    return store.removeItem(key);
                }
            },
            clearAll: function (key) {
                if (store && 'sessionlocal'.indexOf(type) !== -1 ) {
                    return store.clear();
                }
            },
            each: function (func) {

            },
            on: function(eventType, func) {
                window.addEventListener(eventType, func, false);
            }
        }
        return self;
    }
    var builtInModules = builtInModules || {
            'form': ebapForm,
            'list': ebapList,
            'modal': ebapModal,
            'tabs': ebapTabs,
            'login': ebapLogin,
            'ajax': ebapAjax,
            'store': ebapStore,
            'smodules': ebapSameModules
        };
    for (var m in builtInModules) {
        ebapModules[m] = builtInModules[m] || function () {};
    }
    // 将模块注册进ebapBase
    /**
     * @param {any} moduleKey 
     * @param {any} module 
     */
    function regesiter(moduleKey,module) {
        if (moduleKey && nativeToString.call(moduleKey) == '[object Object]') {
            $.each(moduleKey, function(m, ms) {
                if (m && ms) {
                    ebapModules[m] =  ms;
                }
            })
        } else {
            var __moduleKey = moduleKey;
            if (__moduleKey && ($.inArray(typeof module, ['function', 'object'])>-1) ) {
                ebapModules[__moduleKey] = module;
            }

        }
    }
    // 获取模块实例
    function get(options) {
        if (options.beforeParse && typeof options.beforeParse === 'function') {
            options.beforeParse();
            miniSupport('parse')();
            isParsed = true;
        } else {
            if (!isParsed) {
                miniSupport('parse')();
                isParsed = true;
            }
        }
        var __moduleKey = options.key || '';
        var __moduleArr = [];
        var optionsTimesamp = null;
        var moduleLen = null;
        var moduleDeps = {};
        var moduleSettings = {
            settings: {}
        };
        var isMounted = false;
        var returnModuleIns = null;
        // 将公共内部配置，get方法传入的配置，以及默认配置，混合后生成的配置
        options = $.extend({}, commonCfg[__moduleKey] || {}, options);
        var parseOBK = getAllOptions(options);
        var winMoudleName = '';
        var originModuleSettings = parseOBK('settings', {});
        // 获取当前所用的ui库
        config.uiLib =  parseOBK('uiLib', config.uiLib);
        // 解析options.settings
        $.each(originModuleSettings || {}, function(m, ms) {
            if (m.toLowerCase().slice(-3) === 'url') {
                moduleSettings.settings[m] = utils.prefixPath(ms);
            } else {
                moduleSettings.settings[m+'Url'] = utils.prefixPath(ms);
            }
        });
        // 对mounted或者beforeCreated返回的参数作比较
        function transformObjOrEmpty(obj) {
            if(!obj) {
                isMounted = true;
                return undefined;
            }
            if (obj && nativeToString.call(obj) === '[object Object]' && (obj.$$type === config.nameSpace || obj.$$timesamp === optionsTimesamp)) {
                isMounted = true;
                return obj;
            }
            return undefined;
        }
        if (typeof __moduleKey == 'string') {
            // 依赖解析，分析options.deps
            moduleDeps = utils.genDepsIns(options.deps);
            // 生成当前options时间戳字段，用于后续判断当前配置是否被硬性更改
            optionsTimesamp = config.nameSpace + new Date().getTime();
            options = $.extend(true,options, {moduleDeps: moduleDeps,$$timesamp: optionsTimesamp});
            // 在依赖分析完成之后，即将获取模块之前，对options进行拦截，包装
            if (options.beforeCreate && typeof options.beforeCreate === 'function') {
                options = transformObjOrEmpty(options.beforeCreate(options)) || options;
            }
            // 安全地获取某个模块
            returnModuleIns = utils.safeGetModule(ebapModules, options, moduleSettings);
            // miniui组件实例解析完成，当组件实例不是miniui实例时, options.created传入的是模块实例
            if (!parseOBK('id') && returnModuleIns) {
                options['created'] && typeof options['created'] === 'function' && options['created'](returnModuleIns, moduleDeps)
            }
            // 模块实例已经生成，即将返回的时候，执行options.mounted 方法
            if (options.mounted && typeof options.mounted === 'function' && returnModuleIns) {
                returnModuleIns = $.extend({}, returnModuleIns, transformObjOrEmpty(options.mounted(returnModuleIns || {})));
                isMounted = true;
            }
            // 将模块实例直接挂载到window下面
            if (options.name) {
                winMoudleName = (config.nameSpace + options.name).toUpperCase()+'$';
                while (window[winMoudleName]) {
                    winMoudleName = winMoudleName + '$';
                }
                window[winMoudleName] = returnModuleIns;
            }
            return returnModuleIns;
        } else if (nativeToString.call(__moduleKey) === '[object Array]') {
            // 传入的optins.key是数组时
            moduleLen = __moduleKey.length;
            for (var m = 0; m < moduleLen; m++) {
                if (__moduleKey[m] && typeof __moduleKey[m] === 'string') {
                    // 依赖解析，分析options.deps
                    moduleDeps = utils.genDepsIns(options.deps);
                    // 生成当前options时间戳字段，用于后续判断当前配置是否被硬性更改
                    optionsTimesamp = config.nameSpace + new Date().getTime();
                    options = $.extend(true,options, {moduleDeps: moduleDeps, $$timesamp: optionsTimesamp});
                    // 在依赖分析完成之后，即将获取模块之前，对options进行拦截，包装
                    if (options.beforeCreate && typeof options.beforeCreate === 'function') {
                        options = options.beforeCreate(options) || options;
                    }
                    // moduleIns = utils.getModule(ebapModules, __moduleKey[m]);
                    // moduleIns && typeof moduleIns === 'function' && (waitInject['$$type'] = config.nameSpace);
                    // 安全地获取某个模块
                    returnModuleIns = utils.safeGetModule(ebapModules, options, moduleSettings);
                    ///$.extend(true, moduleIns($.extend({},options,{moduleDeps: moduleDeps})),{ setUrls: utils.setUrls, genParseOBK: utils.genParseOBK, getDepsIns: utils.getDepsIns,extend: utils.extend, getIns: utils.getIns, insId: options.id, moduleType: options.key, moduleDeps: moduleDeps }, moduleSettings);
                    // miniui组件实例解析完成，当组件实例不是miniui实例时, options.created传入的是模块实例
                    if (!parseOBK('id') && returnModuleIns) {
                        options['created'] && typeof options['created'] === 'function' && options['created'](returnModuleIns)
                    }
                    // 模块实例已经生成，即将返回的时候，执行options.mounted 方法
                    if (options.mounted && typeof options.mounted === 'function' && returnModuleIns) {
                        if (transformObjOrEmpty(options.mounted(returnModuleIns))) {
                            returnModuleIns = $.extend({}, returnModuleIns, transformObjOrEmpty(options.mounted(returnModuleIns)));
                        }
                    }
                    // 将模块实例直接挂载到window下面
                    if (options.name) {
                        winMoudleName = (config.nameSpace + options.name).toUpperCase() + '$';
                        while (window[winMoudleName]) {
                            winMoudleName = winMoudleName + '$';
                        }
                        window[winMoudleName] = returnModuleIns;
                    }
                    __moduleArr.push(returnModuleIns)
                }
            }
            return __moduleArr;
        }
    }
    function initGlobalEvent() {
        //所有ajax请求异常的统一处理函数，处理
        $(document).ajaxError(
            function (event, xhr, options, exc) {
                if (xhr.status == 'undefined') {
                    return;
                }
                // 后台返回的错误信息
                var errorJson = support('mini', 'decode')(xhr.responseText);
                if(errorJson && errorJson.ebaperror) {
                    var resJson = {
                        desc: errorJson.message,
                        detailInfo: [
                            {
                                name: errorJson.detail,
                                description: undefined
                            }
                        ]
                    }
                    var customModal = utils.get({
                        key: 'modal',
                        tplCfg: {
                            desc: resJson.desc,
                            detailInfo: resJson.detailInfo
                        },
                        selector: '.ebap-maskContainer',
                        context: document
                    });
                }
            }
        );
    }
    for (var u in utils) {
        if (!($.inArray(u, config.enableList.lock)>-1)) {
            utilsPool[u] = utils[u];
        }
    }
    // ebapBase初始化，使用了单例,保证全局唯一
    (function init() {
        if (typeof ebapLogin === 'function') {
            var ebapLoginIns = ebapLogin({
                url: '/a/login'
            });
            ebapLoginIns.out();
        }
        initGlobalEvent();
        if (!ebapInstance) {
            ebapInstance = {
                regesiter: regesiter,
                utils: utils,
                get: get,
                setUp: setUp
            };
        }
    })();
    return ebapInstance
})();
return ebapBase;
});

// 快捷方法
var ebapUtils = ebapBase.utils;
var ebapMiniSupport = ebapUtils.miniSupport;