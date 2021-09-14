var expect = require('chai').expect;
var jsdom = require('jsdom');
var ConstructorioID = require('../src/constructorio-id.js');

describe('ConstructorioID', function () {
  beforeEach(function () {
    var dom = new jsdom.JSDOM('', {
      url: 'http://localhost'
    });
    global.window = dom.window;
    global.document = dom.window.document;
  });

  afterEach(function () {
    delete global.window;
    delete global.document;
  });

  describe('set_cookie', function () {
    it('should create a cookie with a valid path', function () {
      var session = new ConstructorioID();
      var cookieData =  session.set_cookie('mewantcookie', 'meeatcookie');
      expect(cookieData).to.match(/mewantcookie=meeatcookie; expires=.*; path=\//);
    });

    it('should create a cookie using the root domain if there are one or more top level domains', function () {
      var dom = new jsdom.JSDOM('', {
        url: 'https://www.constructor.co.uk'
      });
      global.window = dom.window;
      global.document = dom.window.document;

      var session = new ConstructorioID();
      var cookieData =  session.set_cookie('mewantcookie', 'meeatcookie');
      expect(cookieData).to.match(/mewantcookie=meeatcookie; expires=.*; path=\/; domain=constructor.co.uk/);
    });

    it('should create a cookie using the root domain if there are one or more subdomains', function () {
      var dom = new jsdom.JSDOM('', {
        url: 'https://subdomain1.subdomain2.constructor.com.au'
      });
      global.window = dom.window;
      global.document = dom.window.document;

      var session = new ConstructorioID();
      var cookieData =  session.set_cookie('mewantcookie', 'meeatcookie');
      expect(cookieData).to.match(/mewantcookie=meeatcookie; expires=.*; path=\/; domain=constructor.com.au/);
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
      expect(value).to.be.undefined;
    });

    it('should handle unencoded cookies gracefully', function () {
      document.cookie = 'melikecookie=omnomnom';
      document.cookie = 'badly=encoded%cookie';

      var session = new ConstructorioID();
      var value = session.get_cookie('melikecookie');

      expect(value).to.match(/^omnomnom$/);
    });
  });

  describe('delete_cookie', function () {
    it('should remove a matching cookie', function () {
      document.cookie = 'dummyname=dummyid; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';
      document.cookie = 'deleteme=now; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';
      var session = new ConstructorioID({ cookie_name_client_id: 'dummyname' });
      session.delete_cookie('deleteme');
      expect(document.cookie).to.equal('dummyname=dummyid');
    });

    it('should skip a non-matching cookie', function () {
      document.cookie = 'dummyname=dummyid; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';
      document.cookie = 'skipme=now; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';
      var session = new ConstructorioID({ cookie_name_client_id: 'dummyname' });
      session.delete_cookie('deleteme');
      expect(document.cookie).to.equal('dummyname=dummyid; skipme=now');
    });
  });

  describe('generate_client_id', function () {
    it('should return a client id and set the cookie', function () {
      var session = new ConstructorioID({ cookie_name_client_id: 'monster' });
      var client_id = session.generate_client_id();
      expect(session.get_cookie('monster')).to.equal(client_id);
      expect(client_id).to.be.a.string;
      expect(client_id).to.match(/(\w|d|-){36}/);
    });

    describe('when the storage location is set to local', function () {
      it('should return a client id and set local storage value', function () {
        var session = new ConstructorioID({ local_name_client_id: 'monster', client_id_storage_location: 'local' });
        var client_id = session.generate_client_id();
        expect(session.get_local_object('monster')).to.equal(client_id);
        expect(client_id).to.be.a.string;
        expect(client_id).to.match(/(\w|d|-){36}/);
      });

      it('should use client id from cookies if the data is not available in local storage', function () {
        document.cookie = 'ConstructorioID_client_id=chummyid; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';
        var session = new ConstructorioID({ client_id_storage_location: 'local' });
        expect(session.get_local_object('_constructorio_search_client_id')).to.equal('chummyid');
      });
    });
  });
});
