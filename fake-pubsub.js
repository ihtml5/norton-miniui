(function (root, factory) {
	var Pubsub = {};
	root.Pubsub = Pubsub;
	factory(Pubsub);
	if (typeof define === 'function' && define.amd) {
		define(function () {
			return Pubsub;
		})
	} else if (typeof exports === 'object') {
		if (module !== 'undefined' && module.exports) {
			exports = module.exports = Pubsub;
		}
		exports.Pubsub = PubSub;
	}
})(typeof window === 'object' && window, function (Pubsub) {
	'use strict';
	var nativeHasOwn = Object.prototype.hasOwnProperty;
	var messages = {};
	var lastUid = -1;
	// 判断一个对象是否有键值对
	function hasKeys( obj ) {
		if (!obj) return;
		var key = null;
		for (key in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, key)) {
				return true;
			}
		}
		return false;
	}
	// setTimeout 回调函数
	function throwException (ex) {
		return function reThrowException() {
			throw ex;
		};
	}

	function callSubscriberWithDelayedExceptions( subscriber, message, data) {
		try {
			subscriber( message, data );
		} catch (ex) {
			setTimeout( throwException ( ex ), 0);
		}
	}

	function callSubscriberWithImmediateExceptions( subscriber, message, data) {
		subscriber( message, data );
	}

	function deliverMsg( originalMsg, matchedMsg, data, immediateExceptions) {
		console.log('::::matched', originalMsg, matchedMsg, messages);
		if (!nativeHasOwn.call(messages, matchedMsg)) {
			return;
		}
		var subscribers = messages[matchedMsg];
		var callSubscriber = immediateExceptions ? callSubscriberWithImmediateExceptions : callSubscriberWithDelayedExceptions;
		for ( var s in subscribers) {
			if (nativeHasOwn.call(subscribers, s)) {
				callSubscriber(subscribers[s], originalMsg, data);
			}
		}
	}

	function createDeliveryFunc ( msg, data, immediateExceptions) {
		return function deliverNamespaced () {
			var topic = String(msg);
			var position = topic.lastIndexOf('.');
			deliverMsg( msg, topic, data, immediateExceptions);
			while ( position !== -1) {
				topic = topic.substr( 0, position );
				position = topic.lastIndexOf('.');
				deliverMsg( msg, topic, data, immediateExceptions);
			}
		}
	}

	function checkMsgHasSubscribers(message) {
		var topic = String(message);
		var found = Boolean(nativeHasOwn.call(messages, topic) && hasKeys(messages[topic]));
		var position = topic.lastIndexOf('.');
		while (!found && position !== -1) {
			topic = topic.substr(0, position);
			position = topic.lastIndexOf('.');
			found = Boolean(nativeHasOwn.call(messages, topic) && hasKeys(messages[topic]));
		}

		return found;
	}
	
	function publish( msg, data, sync , immediateExceptions) {
		var deliver = createDeliveryFunc( msg, data, immediateExceptions);
		var msgHasSubscribers = checkMsgHasSubscribers(msg);
		if (!msgHasSubscribers) {
			return false;
		}
		if (sync === true) {
			deliver();
		} else {
			setTimeout( deliver, 0);
		}
		return true;
	}

	Pubsub.publish = function (msg, data) {
		return publish( msg, data, false, Pubsub.immediateExceptions);
	}

	Pubsub.publishSync = function (msg, data) {
		return publish( msg, data, true, Pubsub.immediateExceptions);
	}

	Pubsub.subscribe = function (msg ,func) {
		if (typeof func !== 'function') {
			return false;
		}
		if (!nativeHasOwn.call(messages, msg)) {
			messages[msg] = {};
		}

		var token = 'uid_' + String(++lastUid);
		messages[msg][token] = func;
		return token;
	}

	Pubsub.clearAllSubscriptions = function clearAllSubscriptions () {
		messages = {};
	}

	Pubsub.clearSubscriptions = function clearSubscriptions (topic) {
		var m = null;
		for ( m in messages) {
			if (nativeHasOwn.call(messages, m) && m.indexOf(topic) === 0) {
				delete messages[m];
			}
		}
	}

	Pubsub.unsubscribe = function (value) {
		var descendantTopicExists = function (topic) {
			var m = null;
			for ( m in messages) {
				if (nativeHasOwn.call(messages, m) && m.indexOf(topic) === 0) {
					return true;
				}
			}
			return false;
		}

		var isTopic = typeof value === 'string' && (nativeHasOwn.call(messages, value) || descendantTopicExists(value));
		var isToken = !isTopic && typeof value === 'string';
		var isFunction = typeof value === 'function';
		var result = false;
		var m = null;
		var msg = null;
		var t = null;
		if (isTopic) {
			Pubsub.clearAllSubscriptions(value);
			return;
		}
		for (m in messages) {
			if (nativeHasOwn.call(messages, m)) {
				msg = messages[m];

				if (isToken && msg[value]) {
					delete msg[value];
					result = value;
					break;
				}
				if (isFunction) {
					for (var t in msg) {
						if (nativeHasOwn.call(t) && msg[t] === value) {
							delete msg[t];
							result = true;
						}
					}
				}
			}
		}
	}
});
