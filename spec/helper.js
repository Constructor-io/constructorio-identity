/* eslint-disable no-return-assign, no-undefined */

/*
 * Returns a mock object for local or session storage
 * Based on https://gist.github.com/juliocesar/926500
 */
function getStorageMock() {
  return {
    _data: {},
    setItem: function (id, val) { return this._data[id] = String(val); },
    getItem: function (id) { return this._data.hasOwnProperty(id) ? this._data[id] : undefined; },
    removeItem: function (id) { return delete this._data[id]; },
    clear: function () { return this._data = {}; }
  };
}

/*
 * Returns a value given the cookie name
 */
function getCookie(name) {
  var re = new RegExp(name + '=([^;]+)');
  var value = re.exec(document.cookie);
  return (value !== null) ? unescape(value[1]) : null;
}

module.exports = {
  getStorageMock: getStorageMock,
  getCookie: getCookie
};
