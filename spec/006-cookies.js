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

    it('should create a cookie without secure flag using defaults', function () {
      var session = new ConstructorioID();
      var cookieData =  session.set_cookie('mewantcookie', 'meeatcookie');
      expect(cookieData).to.not.match(/mewantcookie=meeatcookie; expires=.*; path=\/; secure/);
    });

    it('should create a cookie with secure flag', function () {
      var session = new ConstructorioID({ cookie_secure: true });
      var cookieData =  session.set_cookie('mewantcookie', 'meeatcookie');
      expect(cookieData).to.match(/mewantcookie=meeatcookie; expires=.*; path=\/; secure/);
    });

    it('should create a cookie without samesite flag using defaults', function () {
      var session = new ConstructorioID();
      var cookieData =  session.set_cookie('mewantcookie', 'meeatcookie');
      expect(cookieData).to.not.match(/mewantcookie=meeatcookie; expires=.*; path=\/; samesite/);
    });

    it('should create a cookie with samesite flag', function () {
      var session = new ConstructorioID({ cookie_samesite: 'strict' });
      var cookieData =  session.set_cookie('mewantcookie', 'meeatcookie');
      expect(cookieData).to.match(/mewantcookie=meeatcookie; expires=.*; path=\/; samesite=strict/);
    });

    it('should create a cookie with samesite flag', function () {
      var session = new ConstructorioID({ cookie_samesite: 'lax' });
      var cookieData =  session.set_cookie('mewantcookie', 'meeatcookie');
      expect(cookieData).to.match(/mewantcookie=meeatcookie; expires=.*; path=\/; samesite=lax/);
    });

    it('should create a cookie with samesite and secure flags', function () {
      var session = new ConstructorioID({ cookie_samesite: 'strict', cookie_secure: true });
      var cookieData =  session.set_cookie('mewantcookie', 'meeatcookie');
      expect(cookieData).to.match(/mewantcookie=meeatcookie; expires=.*; path=\/; secure; samesite=strict/);
    });

    describe('when encode_cookie_values is false (default)', function () {
      it('should not encode cookie values', function () {
        var session = new ConstructorioID({ encode_cookie_values: false });
        var cookieData = session.set_cookie('testcookie', 'hello world');
        expect(cookieData).to.match(/testcookie=hello world;/);
      });

      it('should default encode_cookie_values to false', function () {
        var session = new ConstructorioID();
        expect(session.encode_cookie_values).to.be.false;
      });
    });

    describe('when encode_cookie_values is true', function () {
      it('should encode cookie values', function () {
        var session = new ConstructorioID({ encode_cookie_values: true });
        var cookieData = session.set_cookie('testcookie', 'hello world');
        expect(cookieData).to.match(/testcookie=hello%20world;/);
      });

      it('should encode special characters', function () {
        var session = new ConstructorioID({ encode_cookie_values: true });
        var cookieData = session.set_cookie('testcookie', 'value=with;special&chars');
        expect(cookieData).to.match(/testcookie=value%3Dwith%3Bspecial%26chars;/);
      });
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

    describe('when encode_cookie_values is true', function () {
      it('should decode cookie values', function () {
        var session = new ConstructorioID({ encode_cookie_values: true });
        document.cookie = 'testcookie=hello%20world; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';
        var value = session.get_cookie('testcookie');
        expect(value).to.equal('hello world');
      });

      it('should read existing unencoded JSON values (backwards compatibility)', function () {
        var jsonValue = '{"sessionId":42,"lastTime":1234567890}';
        document.cookie = 'legacycookie=' + jsonValue + '; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';
        var session = new ConstructorioID({ encode_cookie_values: true });
        var retrievedValue = session.get_cookie('legacycookie');
        expect(retrievedValue).to.equal(jsonValue);
        expect(JSON.parse(retrievedValue)).to.deep.equal({ sessionId: 42, lastTime: 1234567890 });
      });

      it('should correctly set and get values with special characters', function () {
        var session = new ConstructorioID({ encode_cookie_values: true });
        var originalValue = 'value=with;special,chars?query#hash,';
        session.set_cookie('testcookie', originalValue);
        var retrievedValue = session.get_cookie('testcookie');
        expect(retrievedValue).to.equal(originalValue);
      });

      it('should correctly set and get JSON values', function () {
        var session = new ConstructorioID({ encode_cookie_values: true });
        var jsonValue = JSON.stringify({ sessionId: 42, lastTime: 1234567890 });
        session.set_cookie('jsoncookie', jsonValue);
        var retrievedValue = session.get_cookie('jsoncookie');
        expect(retrievedValue).to.equal(jsonValue);
        expect(JSON.parse(retrievedValue)).to.deep.equal({ sessionId: 42, lastTime: 1234567890 });
      });

      it('should handle values containing percent signs', function () {
        var session = new ConstructorioID({ encode_cookie_values: true });
        var valueWithPercent = '50% off sale';
        session.set_cookie('testcookie', valueWithPercent);
        var retrievedValue = session.get_cookie('testcookie');
        expect(retrievedValue).to.equal(valueWithPercent);
      });

      it('should store and retrieve client_id correctly', function () {
        var session = new ConstructorioID({
          encode_cookie_values: true,
          client_id_storage_location: 'cookie'
        });
        var clientId = session.client_id;
        expect(clientId).to.match(/[\w-]{36}/);
        expect(session.get_cookie('ConstructorioID_client_id')).to.equal(clientId);
      });

      it('should store and retrieve session data correctly', function () {
        var session = new ConstructorioID({
          encode_cookie_values: true,
          session_id_storage_location: 'cookie'
        });
        var sessionDataCookie = session.get_cookie('ConstructorioID_session');
        var sessionData = JSON.parse(sessionDataCookie);
        expect(sessionData.sessionId).to.equal(session.session_id);
        expect(sessionData.lastTime).to.be.a('number');
      });
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
