var expect = require('chai').expect;
var jsdom = require('jsdom');
var ConstructorioAB = require('../src/constructorio-ab.js');

describe('ConstructorioAB.Session', function () {
  beforeEach(function () {
    var dom = new jsdom.JSDOM();
    global.window = dom.window;
    global.document = dom.window.document;
  });

  afterEach(function () {
    delete global.window;
    delete global.document;
  });

  describe('set_cookie', function () {
    it('should create a cookie', function () {
      var session = new ConstructorioAB.Session();
      session.set_cookie('mewantcookie', 'meeatcookie');
      expect(global.document.cookie).to.match(/mewantcookie=meeatcookie/);
    });
  });

  describe('get_cookie', function () {
    it('should read an existing cookie', function () {
      document.cookie = 'melikecookie=omnomnom; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';
      var session = new ConstructorioAB.Session();
      var value = session.get_cookie('melikecookie');
      expect(value).to.match(/^omnomnom$/);
    });

    it('should not read a missing cookie', function () {
      var session = new ConstructorioAB.Session();
      var value = session.get_cookie('melikecookie');
      expect(value).to.equal('');
    });
  });

  describe('generate_client_id', function () {

  });

  describe('persisted_client_id', function () {

  });

  describe('_request_uri', function () {

  });

  describe('_in_array', function () {

  });
});
