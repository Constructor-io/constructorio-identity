var expect = require('chai').expect;
var jsdom = require('jsdom');
var helper = require('./helper');
var ConstructorioID = require('../src/constructorio-id.js');

describe('ConstructorioID', function () {
  it('should have a defined interface', function () {
    var actualKeys = Object.keys(ConstructorioID.prototype);
    var expectedKeys = [
      'set_cookie',
      'get_cookie',
      'delete_cookie',
      'generate_client_id',
      'get_local_object',
      'set_local_object',
      'delete_local_object',
      'generate_session_id'
    ];
    expect(actualKeys).to.eql(expectedKeys);
  });

  it('should provide defaults', function () {
    var session = new ConstructorioID();
    expect(session.user_agent).to.be.null;
    expect(session.persist).to.be.true;
    expect(session.cookie_name_client_id).to.equal('ConstructorioID_client_id');
    expect(session.cookie_name_session_data).to.equal('ConstructorioID_session');
    expect(session.local_name_client_id).to.equal('_constructorio_search_client_id');
    expect(session.local_name_session_data).to.equal('_constructorio_search_session');
    expect(session.client_id_storage_location).to.equal('cookie');
    expect(session.session_id_storage_location).to.equal('local');
    expect(session.cookie_domain).to.be.null;
  });

  it('should override defaults with options', function () {
    var session = new ConstructorioID({
      base_url: 'dummyurl',
      ip_address: 'dummyip',
      user_agent: 'dummyagent',
      timeout: 1,
      persist: false,
      cookie_name_client_id: 'dummyclientname',
      cookie_name_session_data: 'dummysessionname',
      local_name_client_id: 'dummyclientnamelocal',
      local_name_session_data: 'dummysessionnamelocal',
      cookie_prefix_for_experiment: 'dummyprefix',
      cookie_domain: 'dummydomain',
      client_id_storage_location: 'foo',
      session_id_storage_location: 'bar'
    });
    expect(session.base_url).to.equal('dummyurl');
    expect(session.ip_address).to.equal('dummyip');
    expect(session.user_agent).to.equal('dummyagent');
    expect(session.timeout).to.equal(1);
    expect(session.persist).to.be.false;
    expect(session.cookie_name_client_id).to.equal('dummyclientname');
    expect(session.cookie_name_session_data).to.equal('dummysessionname');
    expect(session.local_name_client_id).to.equal('dummyclientnamelocal');
    expect(session.local_name_session_data).to.equal('dummysessionnamelocal');
    expect(session.cookie_prefix_for_experiment).to.equal('dummyprefix');
    expect(session.cookie_domain).to.equal('dummydomain');
    expect(session.client_id_storage_location).to.equal('foo');
    expect(session.session_id_storage_location).to.equal('bar');
  });

  describe('when used in browser', function () {
    beforeEach(function () {
      var dom = new jsdom.JSDOM('', {
        url: 'http://localhost'
      });
      global.window = dom.window;
      global.window.localStorage = helper.getStorageMock();
      global.document = dom.window.document;
    });

    afterEach(function () {
      delete global.window;
      delete global.document;
    });

    it('should read the client id from a named cookie', function () {
      document.cookie = 'dummyname=dummyid; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';
      var session = new ConstructorioID({ cookie_name_client_id: 'dummyname' });
      expect(session.client_id).to.equal('dummyid');
      expect(document.cookie).to.equal('dummyname=dummyid');
    });

    it('should set the client id if missing from the default storage location', function () {
      document.cookie = 'ConstructorioID_client_id=bummyid; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';
      var session = new ConstructorioID();
      expect(session.client_id).to.equal('bummyid');
      expect(document.cookie).to.equal('ConstructorioID_client_id=bummyid');
    });

    it('should set the client id if missing', function () {
      var session = new ConstructorioID({ cookie_name_client_id: 'missingname' });
      expect(session.client_id).to.be.a.string;
      expect(session.client_id).to.match(/(\w|d|-){36}/);
    });

    describe('when the storage location is set to local', function () {
      it('should read the client id from local storage', function () {
        window.localStorage.setItem('dummyname', 'dummyid');
        var session = new ConstructorioID({ local_name_client_id: 'dummyname', client_id_storage_location: 'local' } );
        expect(session.client_id).to.equal('dummyid');
        expect(window.localStorage.getItem('dummyname')).to.equal('dummyid');
      });

      it('should read the client id from the default local storage name', function () {
        window.localStorage.setItem('_constructorio_search_client_id', 'bummyid');
        var session = new ConstructorioID({ client_id_storage_location: 'local' });
        expect(session.client_id).to.equal('bummyid');
        expect(window.localStorage.getItem('_constructorio_search_client_id')).to.equal('bummyid');
      });

      it('should read the client id from cookies if it does not exist in local storage and remove it from the cookies', function () {
        document.cookie = 'ConstructorioID_client_id=chummyid; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';
        var session = new ConstructorioID({ client_id_storage_location: 'local' });
        var cookieData = JSON.parse(helper.getCookie('ConstructorioID_client_id'));
        expect(session.client_id).to.equal('chummyid');
        expect(window.localStorage.getItem('_constructorio_search_client_id')).to.equal('chummyid');
        expect(cookieData).to.equal(null);
      });

      it('should set the client id if missing from both local storage and cookies', function () {
        var session = new ConstructorioID({ client_id_storage_location: 'local' });
        expect(session.client_id).to.be.a.string;
        expect(session.client_id).to.match(/(\w|d|-){36}/);
      });
    });


    it('should read the session id from local storage data', function () {
      window.localStorage.setItem('_constructorio_search_session', JSON.stringify({
        sessionId: 42,
        lastTime: Date.now()
      }));
      var session = new ConstructorioID();
      expect(session.session_id).to.be.a('number');
      expect(session.session_id).to.equal(42);
    });

    it('should set the session id to 1 if there is no local storage data', function () {
      var session = new ConstructorioID();
      expect(session.session_id).to.be.a('number');
      expect(session.session_id).to.equal(1);
    });

    it('should set the session id if local storage data can be parsed into a number', function () {
      window.localStorage.setItem('_constructorio_search_session', JSON.stringify({
        sessionId: '42',
        lastTime: Date.now()
      }));
      var session = new ConstructorioID();
      expect(session.session_id).to.be.a('number');
      expect(session.session_id).to.equal(42);
    });

    it('should set the session id if local storage data can be parsed into a number (extra comma)', function () {
      window.localStorage.setItem('_constructorio_search_session', JSON.stringify({
        sessionId: '44,',
        lastTime: Date.now()
      }));
      var session = new ConstructorioID();
      expect(session.session_id).to.be.a('number');
      expect(session.session_id).to.equal(44);
    });

    it('should set the session id to 1 if local storage data cannot be parsed into a number (NaN)', function () {
      window.localStorage.setItem('_constructorio_search_session', JSON.stringify({
        sessionId: NaN,
        lastTime: Date.now()
      }));
      var session = new ConstructorioID();
      expect(session.session_id).to.be.a('number');
      expect(session.session_id).to.equal(1);
    });

    it('should set the session id to 1 if local storage data cannot be parsed into a number (null)', function () {
      window.localStorage.setItem('_constructorio_search_session', JSON.stringify({
        sessionId: null,
        lastTime: Date.now()
      }));
      var session = new ConstructorioID();
      expect(session.session_id).to.be.a('number');
      expect(session.session_id).to.equal(1);
    });

    it('should set the session id to 1 if local storage data cannot be parsed into a number', function () {
      window.localStorage.setItem('_constructorio_search_session', JSON.stringify({
        sessionId: ',,,11',
        lastTime: Date.now()
      }));
      var session = new ConstructorioID();
      expect(session.session_id).to.be.a('number');
      expect(session.session_id).to.equal(1);
    });

    describe('when the storage location is set to cookie', function () {
      it('should read the session id from cookie', function () {
        document.cookie = `ConstructorioID_session={"sessionId":42,"lastTime":${Date.now()}}; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/`;
        var session = new ConstructorioID({ session_id_storage_location: 'cookie' });
        expect(session.session_id).to.be.a('number');
        expect(session.session_id).to.equal(42);
      });

      it('should read the session id from the default cookie name', function () {
        document.cookie = `ConstructorioID_session={"sessionId":42,"lastTime":${Date.now()}}; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/`;
        var session = new ConstructorioID({ session_id_storage_location: 'cookie' });
        var cookieData = JSON.parse(helper.getCookie('ConstructorioID_session'));
        expect(session.session_id).to.equal(42);
        expect(cookieData.sessionId).to.equal(42);
      });

      it('should read the session id from local storage if there is no cookie and remove it from local storage', function () {
        window.localStorage.setItem('_constructorio_search_session', JSON.stringify({
          sessionId: '11',
          lastTime: Date.now()
        }));
        var session = new ConstructorioID({ session_id_storage_location: 'cookie' } );
        var cookieData = JSON.parse(helper.getCookie('ConstructorioID_session'));
        expect(window.localStorage.getItem('_constructorio_search_session')).to.equal(null);
        expect(session.session_id).to.equal(11);
        expect(cookieData.sessionId).to.equal(11);
      });

      it('should set the session id to 1 if missing from both local storage and cookies', function () {
        var session = new ConstructorioID({ session_id_storage_location: 'cookie' } );
        expect(session.session_id).to.be.a('number');
        expect(session.session_id).to.equal(1);
      });
    });

    it('should set the session id if cookie data can be parsed into a number', function () {
      document.cookie = `ConstructorioID_session={"sessionId":"42","lastTime":${Date.now()}}; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/`;
      var session = new ConstructorioID({ session_id_storage_location: 'cookie' });
      expect(session.session_id).to.be.a('number');
      expect(session.session_id).to.equal(42);
    });

    it('should set the session id if cookie data can be parsed into a number (extra comma)', function () {
      document.cookie = `ConstructorioID_session={"sessionId":"44,","lastTime":${Date.now()}}; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/`;
      var session = new ConstructorioID({ session_id_storage_location: 'cookie' });
      expect(session.session_id).to.be.a('number');
      expect(session.session_id).to.equal(44);
    });

    it('should set the session id to 1 if cookie data cannot be parsed into a number (NaN)', function () {
      document.cookie = `ConstructorioID_session={"sessionId":NaN,"lastTime":${Date.now()}}; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/`;
      var session = new ConstructorioID({ session_id_storage_location: 'cookie' });
      expect(session.session_id).to.be.a('number');
      expect(session.session_id).to.equal(1);
    });

    it('should set the session id to 1 if cookie data cannot be parsed into a number (null)', function () {
      document.cookie = `ConstructorioID_session={"sessionId":null,"lastTime":${Date.now()}}; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/`;
      var session = new ConstructorioID({ session_id_storage_location: 'cookie' });
      expect(session.session_id).to.be.a('number');
      expect(session.session_id).to.equal(1);
    });

    it('should set the session id to 1 if cookie data cannot be parsed into a number', function () {
      document.cookie = `ConstructorioID_session={"sessionId":",,,,1","lastTime":${Date.now()}}; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/`;
      var session = new ConstructorioID({ session_id_storage_location: 'cookie' });
      expect(session.session_id).to.be.a('number');
      expect(session.session_id).to.equal(1);
    });

    it('should set session_is_new to false if the session is not new', function () {
      window.localStorage.setItem('_constructorio_search_session', JSON.stringify({
        sessionId: 42,
        lastTime: Date.now()
      }));
      var session = new ConstructorioID();
      expect(session.session_id).to.equal(42);
      expect(session.session_is_new).to.be.a('boolean');
      expect(session.session_is_new).to.equal(false);
    });

    it('should set session_is_new to true if the session is new', function () {
      window.localStorage.setItem('_constructorio_search_session', JSON.stringify({
        sessionId: 42,
        lastTime: Date.now() - 1000 * 60 * 60 * 24 * 60
      }));
      var session = new ConstructorioID();
      expect(session.session_id).to.equal(43);
      expect(session.session_is_new).to.be.a('boolean');
      expect(session.session_is_new).to.equal(true);
      expect(session.new_to_beacon).to.equal(null);
    });

    it('should set session_is_new to false if the session is not new and storage location is set to cookie', function () {
      document.cookie = `ConstructorioID_session={"sessionId":42,"lastTime":${Date.now()}}; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/`;
      var session = new ConstructorioID({ session_id_storage_location: 'cookie' });
      expect(session.session_id).to.equal(42);
      expect(session.session_is_new).to.be.a('boolean');
      expect(session.session_is_new).to.equal(false);
    });

    it('should set session_is_new to true if the session is new and storage location is set to cookie', function () {
      document.cookie = `ConstructorioID_session={"sessionId":42,"lastTime":${Date.now() - 1000 * 60 * 60 * 24 * 60}}; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/`;
      var session = new ConstructorioID({ session_id_storage_location: 'cookie' });
      expect(session.session_id).to.equal(43);
      expect(session.session_is_new).to.be.a('boolean');
      expect(session.session_is_new).to.equal(true);
      expect(session.new_to_beacon).to.equal(null);
    });

    it('should set session_is_new to true if there is no local storage data', function () {
      var session = new ConstructorioID();
      expect(session.session_is_new).to.be.a('boolean');
      expect(session.session_is_new).to.equal(true);
      expect(session.new_to_beacon).to.equal(null);
    });

    it('should set session_is_new to true if there is no cookie data and storage location is set to cookie', function () {
      var session = new ConstructorioID({ session_id_storage_location: 'cookie' });
      expect(session.session_is_new).to.be.a('boolean');
      expect(session.session_is_new).to.equal(true);
      expect(session.new_to_beacon).to.equal(null);
    });

    it('should set the user agent', function () {
      var session = new ConstructorioID();
      expect(session.user_agent).to.match(/jsdom/);
    });

    it('should set node status to false', function () {
      var session = new ConstructorioID();
      expect(session.on_node).to.be.false;
    });

    describe('when there are multiple instances using different subdomains', function () {
      var dom;

      beforeEach(function () {
        dom = new jsdom.JSDOM('', {
          url: 'http://checkout.localhost.com'
        });
        global.window = dom.window;
        global.window.localStorage = helper.getStorageMock();
        global.document = dom.window.document;
      });

      afterEach(function () {
        delete global.window;
        delete global.document;
      });

      it('should set client_id on the specified cookie_domain', function () {
        // Mimic client-js being instantiated without any cookie_domain on the subdomain
        var clientJsMock = new ConstructorioID({});
        var clientJsMockCookie = clientJsMock.get_cookie('ConstructorioID_client_id');

        // Mimic beacon being instantiated with cookie_domain on the subdomain
        var beaconMock = new ConstructorioID({ cookie_domain: 'localhost.com' });
        var beaconMockCookie = beaconMock.get_cookie('ConstructorioID_client_id');

        // Change domain from checkout.localhost.com to www.localhost.com
        dom.reconfigure({
          url: 'http://www.localhost.com'
        });

        // Mimic beacon being instantiated with cookie_domain on another subdomain
        var beaconMockFromMain = new ConstructorioID({ cookie_domain: 'localhost.com' });
        var beaconMockFromMainCookie = beaconMockFromMain.get_cookie('ConstructorioID_client_id');

        expect(clientJsMockCookie).to.equal(beaconMockCookie);
        expect(beaconMockCookie).to.equal(beaconMockFromMainCookie);
      });

      it('should set session_id on the specified cookie_domain', function () {
        // Mimic client-js being instantiated without any cookie_domain on the subdomain
        var clientJsMock = new ConstructorioID({ session_id_storage_location: 'cookie' });
        var clientJsMockCookie = clientJsMock.get_cookie('ConstructorioID_session_id');

        // Mimic beacon being instantiated with cookie_domain on the subdomain
        var beaconMock = new ConstructorioID({ cookie_domain: 'localhost.com', session_id_storage_location: 'cookie' });
        var beaconMockCookie = beaconMock.get_cookie('ConstructorioID_session_id');

        // Change domain from checkout.localhost.com to www.localhost.com
        dom.reconfigure({
          url: 'http://www.localhost.com'
        });

        // Mimic beacon being instantiated with cookie_domain on another subdomain
        var beaconMockFromMain = new ConstructorioID({ cookie_domain: 'localhost.com', session_id_storage_location: 'cookie' });
        var beaconMockFromMainCookie = beaconMockFromMain.get_cookie('ConstructorioID_session_id');

        expect(clientJsMockCookie).to.equal(beaconMockCookie);
        expect(beaconMockCookie).to.equal(beaconMockFromMainCookie);
      });
    });
  });

  describe('when used in node', function () {
    it('should use the client id if in options', function () {
      var session = new ConstructorioID({ client_id: 'dummyid' });
      expect(session.client_id).to.equal('dummyid');
    });

    it('should generate the client id if missing', function () {
      var session = new ConstructorioID();
      expect(session.client_id).to.be.a.string;
      expect(session.client_id).to.match(/(\w|d|-){36}/);
    });

    it('should use the session id if in options', function () {
      var session = new ConstructorioID({ session_id: 42 });
      expect(session.session_id).to.equal(42);
    });

    it('should use a session id of 1 if missing', function () {
      var session = new ConstructorioID();
      expect(session.session_id).to.be.a('number');
      expect(session.session_id).to.equal(1);
    });

    it('should not set the user agent', function () {
      var session = new ConstructorioID();
      expect(session.user_agent).to.be.null;
    });

    it('should not set session_is_new', function () {
      var session = new ConstructorioID();
      expect(session.session_is_new).to.be.null;
    });

    it('should set node status to true', function () {
      var session = new ConstructorioID();
      expect(session.on_node).to.be.true;
    });

    it('should not set new_to_beacon', function () {
      var session = new ConstructorioID();
      expect(session.new_to_beacon).to.be.null;
    });
  });
});
