var expect = require('chai').expect;
var jsdom = require('jsdom');
var ConstructorioID = require('../src/constructorio-id.js');

describe('ConstructorioID', function () {
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
      var session = new ConstructorioID();
      session.set_cookie('mewantcookie', 'meeatcookie');
      expect(global.document.cookie).to.match(/mewantcookie=meeatcookie/);
    });
  });

  describe('get_cookie', function () {
    it('should read an existing cookie', function () {
      document.cookie = 'melikecookie=omnomnom; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';
      var session = new ConstructorioID();
      var value = session.get_cookie('melikecookie');
      expect(value).to.match(/^omnomnom$/);
    });

    it('should not read a missing cookie', function () {
      var session = new ConstructorioID();
      var value = session.get_cookie('melikecookie');
      expect(value).to.equal('');
    });
  });

  describe('generate_client_id', function () {
    it('should return a client id and set the cookie', function () {
      var session = new ConstructorioID({ cookie_name: 'monster' });
      var client_id = session.generate_client_id();
      expect(session.get_cookie('monster')).to.equal(client_id);
      expect(client_id).to.be.a.string;
      expect(client_id).to.match(/(\w|d|-){36}/);
    });
  });

  describe('persisted_client_id', function () {
    it('should return a client id from the cookie', function () {
      var session = new ConstructorioID({ cookie_name: 'monster' });
      var client_id = session.generate_client_id();
      var persisted_id = session.persisted_client_id();
      expect(client_id).to.equal(persisted_id);
    });
  });

  describe('_request_uri', function () {
    it('should return the endpoint without params', function () {
      var session = new ConstructorioID();
      var uri = session._request_uri('www.end.com/point');
      expect(uri).to.equal('www.end.com/point');
    });

    it('should return the endpoint with empty params', function () {
      var session = new ConstructorioID();
      var uri = session._request_uri('www.end.com/point', {});
      expect(uri).to.equal('www.end.com/point');
    });

    it('should return the endpoint + querystring with params', function () {
      var session = new ConstructorioID();
      var uri = session._request_uri('www.end.com/point', { p1: 'yo', p2: 'mtvraps' });
      expect(uri).to.equal('www.end.com/point?p1=yo&p2=mtvraps');
    });
  });

  describe('_in_array', function () {
    it('should return true if the item is in the array', function () {
      var session = new ConstructorioID();
      var array = ['a', 'b'];
      var value = session._in_array(array, 'b');
      expect(value).to.be.true;
    });

    it('should return false if the item is not in the array', function () {
      var session = new ConstructorioID();
      var array = ['a', 'b'];
      var value = session._in_array(array, 'c');
      expect(value).to.be.false;
    });
  });

  describe('_request', function () {
    it('should append a script tagu with a callback when run in browser', function (done) {
      var session = new ConstructorioID();
      session._request('www.www.www', { a: '1', b: '2' }, 1, function () {
        expect(document.body.children.length).to.equal(1);
        expect(document.body.children[0].type).to.match(/text\/javascript/);
        expect(document.body.children[0].src).to.match(/www\.www\.www\?a=1&b=2&callback=ConstructorioID/);
        expect(document.body.children[0].async).to.be.true;
        done();
      });
    });
  });
});
