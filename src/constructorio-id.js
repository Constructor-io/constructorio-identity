/* eslint-disable no-undefined, no-param-reassign */
(function () {
  // Object.assign polyfill from https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
  Object.assign || Object.defineProperty(Object, 'assign', {enumerable: !1, configurable: !0, writable: !0, value: function (e) {'use strict'; if (void 0 === e || e === null) throw new TypeError('Cannot convert first argument to object'); for (var r = Object(e), t = 1; t < arguments.length; t++) {var n = arguments[t]; if (void 0 !== n && n !== null) {n = Object(n); for (var o = Object.keys(Object(n)), a = 0, c = o.length; c > a; a++) {var i = o[a], b = Object.getOwnPropertyDescriptor(n, i); void 0 !== b && b.enumerable && (r[i] = n[i]);}}} return r;}});

  var counter = 0;

  var ConstructorioID = function (options) {
    var defaults = {
      base_url: 'https://ab.cnstrc.com',
      ip_address: null,
      user_agent: null,
      timeout: 2000,
      persist: true,
      cookie_name: 'ConstructorioID_client_id',
      cookie_prefix_for_experiment: 'ConstructorioID_experiment_',
      cookie_domain: null,
      cookie_time_to_live: 365,
      on_node: typeof window === 'undefined',
      session_is_new: null
    };

    Object.assign(this, defaults, options);

    if (!this.client_id) {
      if (!this.on_node && this.persist) {
        this.update_cookie(this.cookie_name);
        var persisted_id = this.get_cookie(this.cookie_name);
        this.client_id = persisted_id ? persisted_id : this.generate_client_id();
      } else {
        this.client_id = this.generate_client_id();
      }
    }

    if (!this.session_id) {
      if (!this.on_node && this.persist) {
        this.session_id = this.get_session_id();
      } else {
        this.session_id = 1;
      }
    }

    if (!this.on_node) {
      this.user_agent = this.user_agent || (window && window.navigator && window.navigator.userAgent);
    }
  };

  ConstructorioID.prototype.set_cookie = function (name, value) {
    if (!this.on_node && this.persist) {
      var expires = new Date();
      expires.setTime(expires.getTime() + (this.cookie_time_to_live * 24 * 60 * 60 * 1000));

      var cookie_data = name + '=' + value + '; expires=' + expires.toUTCString() + ' path=/';
      if (this.cookie_domain) {
        cookie_data += '; domain=' + this.cookie_domain;
      }
      document.cookie = cookie_data;
    }
  };

  ConstructorioID.prototype.get_cookie = function (name) {
    var cookieName = name + '=';
    var decodedCookie = decodeURIComponent(document.cookie);
    var cookieBits = decodedCookie.split(';');
    for (var i = 0; i < cookieBits.length; i++) {
      var thisCookie = cookieBits[i];
      while (thisCookie.charAt(0) === ' ') { // remove leading spaces
        thisCookie = thisCookie.substring(1);
      }
      if (thisCookie.indexOf(cookieName) === 0) {
        return thisCookie.substring(cookieName.length, thisCookie.length);
      }
    }
    return undefined;
  };

  ConstructorioID.prototype.update_cookie = function (name) {
    if (name.match(/^ConstructorioID_/)) {
      var oldName = name.replace(/^ConstructorioID_/, 'ConstructorioAB_');
      var value = this.get_cookie(oldName);
      if (value) {
        this.set_cookie(name, value);
        this.delete_cookie(oldName);
      }
    }
  };

  ConstructorioID.prototype.delete_cookie = function (name) {
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  };

  ConstructorioID.prototype.generate_client_id = function () {
    // from http://stackoverflow.com/questions/105034
    var client_id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    this.set_cookie(this.cookie_name, client_id);
    return client_id;
  };

  ConstructorioID.prototype.get_local_object = function (key) {
    var data;
    var localStorage = window && window.localStorage;
    if (localStorage && typeof key  === 'string') {
      try {
        data = JSON.parse(localStorage.getItem(key));
      } catch (e) {
        // fail silently
      }
    }
    return data;
  };

  ConstructorioID.prototype.set_local_object = function (key, obj) {
    var localStorage = window && window.localStorage;
    if (localStorage && typeof key  === 'string' && typeof obj === 'object') {
      localStorage.setItem(key, JSON.stringify(obj));
    }
  };

  ConstructorioID.prototype.get_session_id = function () {
    var now = Date.now();
    var thirtyMinutes = 1000 * 60 * 30;
    var sessionKey = '_constructorio_search_session';
    var sessionData = this.get_local_object(sessionKey);
    var sessionId = 1;

    if (sessionData) {
      if (sessionData.lastTime > now - thirtyMinutes) {
        sessionId = sessionData.sessionId;
      } else {
        sessionId = sessionData.sessionId + 1;
      }
    }

    this.session_id = sessionId;
    this.session_is_new = sessionData && sessionData.sessionId === sessionId ? false : true;
    this.set_local_object(sessionKey, {
      sessionId: sessionId,
      lastTime: now
    });

    return sessionId;
  };

  ConstructorioID.prototype.participate = function (experiment_name, alternatives, traffic_fraction, force, callback) {
    if (typeof traffic_fraction === 'function') {
      callback = traffic_fraction;
      traffic_fraction = null;
      force = null;
    } else if (typeof traffic_fraction === 'string') {
      callback = force;
      force = traffic_fraction;
      traffic_fraction = null;
    }
    if (typeof force === 'function') {
      callback = force;
      force = null;
    }

    if (!callback) {
      throw new Error('Callback is not specified');
    }

    if (!experiment_name || !(/^[a-z0-9][a-z0-9\-_ ]*$/).test(experiment_name)) {
      return callback(new Error('Bad experiment_name'));
    }

    if (alternatives.length < 2) {
      return callback(new Error('Must specify at least 2 alternatives'));
    }

    for (var i = 0; i < alternatives.length; i += 1) {
      if (!(/^[a-z0-9][a-z0-9\-_ ]*$/).test(alternatives[i])) {
        return callback(new Error('Bad alternative name: ' + alternatives[i]));
      }
    }
    var params = {client_id: this.client_id,
      experiment: experiment_name,
      alternatives: alternatives};
    if (!this.on_node && force === null) {
      var regex = new RegExp('[\\?&]ConstructorioID-force-' + experiment_name + '=([^&#]*)');
      var results = regex.exec(window.location.search);
      if (results !== null) {
        force = decodeURIComponent(results[1].replace(/\+/g, ' '));
      }
    }
    if (traffic_fraction !== null && !isNaN(traffic_fraction)) {
      params.traffic_fraction = traffic_fraction;
    }
    if (force !== null && this._in_array(alternatives, force)) {
      return callback(null, {'status': 'ok', 'alternative': {'name': force}, 'experiment': {'version': 0, 'name': experiment_name}, 'client_id': this.client_id});
    }
    if (this.ip_address) {
      params.ip_address = this.ip_address;
    }
    if (this.user_agent) {
      params.user_agent = this.user_agent;
    }

    var experiment_cookie_name = this.cookie_prefix_for_experiment + experiment_name;
    this.update_cookie(experiment_cookie_name);
    var alternative_name = this.get_cookie(experiment_cookie_name);
    if (alternative_name && alternatives.indexOf(alternative_name) > -1) {
      var res = {
        status: 'ok',
        alternative: {
          name: alternative_name
        },
        experiment: {
          name: experiment_name
        },
        client_id: this.client_id
      };
      return callback(null, res);
    }

    var t0 = new Date().getTime();
    var that = this;
    return that._request(this.base_url + '/participate', params, this.timeout, function (err, res) {
      if (err) {
        res = {status: 'failed',
          error: err,
          alternative: {name: alternatives[0]}};
        that._request(that.base_url + '/', { 'participate-fail': 1 }, that.timeout, function () {});
      } else if (Math.random() < 0.01) {
        var t1 = new Date().getTime();
        that._request(that.base_url + '/', { 'participate-time': t1 - t0 }, that.timeout, function () {});
      }
      that.set_cookie(experiment_cookie_name, res.alternative.name);
      return callback(null, res);
    });
  };

  ConstructorioID.prototype.convert = function (experiment_name, kpi, callback) {
    if (typeof kpi === 'function') {
      callback = kpi;
      kpi = null;
    }

    if (!callback) {
      callback = function () {};
    }

    if (!experiment_name || !(/^[a-z0-9][a-z0-9\-_ ]*$/).test(experiment_name)) {
      return callback(new Error('Bad experiment_name'));
    }

    var params = {client_id: this.client_id,
      experiment: experiment_name};
    if (this.ip_address) {
      params.ip_address = this.ip_address;
    }
    if (this.user_agent) {
      params.user_agent = this.user_agent;
    }
    if (kpi) {
      params.kpi = kpi;
    }
    return this._request(this.base_url + '/convert', params, this.timeout, function (err, res) {
      if (err) {
        res = {status: 'failed',
          error: err};
      }
      return callback(null, res);
    });
  };

  ConstructorioID.prototype._request = function (uri, params, timeout, callback) {
    var timed_out = false;
    var timeout_handle = setTimeout(function () {
      timed_out = true;
      return callback(new Error('request timed out'));
    }, timeout);

    if (!this.on_node) {
      var cb = 'callback' + (++counter);
      params.callback = 'ConstructorioID.' + cb;
      ConstructorioID[cb] = function (res) {
        if (!timed_out) {
          clearTimeout(timeout_handle);
          return callback(null, res);
        }
      };
    }
    var url = this._request_uri(uri, params);
    if (!this.on_node) {
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = url;
      script.async = true;
      document.body.appendChild(script);
    } else if (SERVER_ENABLED) {
      var http = require('http');
      var req = http.get(url, function (res) {
        var body = '';
        res.on('data', function (chunk) {
          return body += chunk;
        });
        return res.on('end', function () {
          var data;
          if (res.statusCode === 500) {
            data = {status: 'failed', response: body};
          } else {
            data = JSON.parse(body);
          }
          if (!timed_out) {
            clearTimeout(timeout_handle);
            return callback(null, data);
          }
        });
      });
      req.on('error', function (err) {
        if (!timed_out) {
          clearTimeout(timeout_handle);
          return callback(err);
        }
      });
    }
  };

  ConstructorioID.prototype._request_uri = function (endpoint, params) {
    var query_string = [];
    var e = encodeURIComponent;
    for (var key in params) {
      if (params.hasOwnProperty(key)) {
        var vals = params[key];
        if (Object.prototype.toString.call(vals) !== '[object Array]') {
          vals = [vals];
        }
        for (var i = 0; i < vals.length; i += 1) {
          query_string.push(e(key) + '=' + e(vals[i]));
        }
      }
    }
    if (query_string.length) {
      return endpoint + '?' + query_string.join('&');
    }
    return endpoint;
  };

  ConstructorioID.prototype._in_array = function (a, v) {
    for (var i = 0; i < a.length; i++) {
      if (a[i] === v) {
        return true;
      }
    }
    return false;
  };

  if (typeof window !== 'undefined') {
    window.ConstructorioID = ConstructorioID;
  }

  // export module for node or environments with module loaders, such as webpack
  if (typeof module !== 'undefined' && typeof require !== 'undefined') {
    module.exports = ConstructorioID;
  }
})();
