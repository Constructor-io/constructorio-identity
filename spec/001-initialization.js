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
      'update_cookie',
      'delete_cookie',
      'generate_client_id',
      'get_local_object',
      'set_local_object',
      'get_session_id'
    ];
    expect(actualKeys).to.eql(expectedKeys);
  });

  it('should provide defaults', function () {
    var session = new ConstructorioID();
    expect(session.user_agent).to.be.null;
    expect(session.persist).to.be.true;
    expect(session.cookie_name).to.equal('ConstructorioID_client_id');
    expect(session.cookie_domain).to.be.null;
  });

  it('should override defaults with options', function () {
    var session = new ConstructorioID({
      base_url: 'dummyurl',
      ip_address: 'dummyip',
      user_agent: 'dummyagent',
      timeout: 1,
      persist: false,
      cookie_name: 'dummyname',
      cookie_prefix_for_experiment: 'dummyprefix',
      cookie_domain: 'dummydomain'
    });
    expect(session.base_url).to.equal('dummyurl');
    expect(session.ip_address).to.equal('dummyip');
    expect(session.user_agent).to.equal('dummyagent');
    expect(session.timeout).to.equal(1);
    expect(session.persist).to.be.false;
    expect(session.cookie_name).to.equal('dummyname');
    expect(session.cookie_prefix_for_experiment).to.equal('dummyprefix');
    expect(session.cookie_domain).to.equal('dummydomain');
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
      var session = new ConstructorioID({ cookie_name: 'dummyname' });
      expect(session.client_id).to.equal('dummyid');
      expect(document.cookie).to.equal('dummyname=dummyid');
    });

    it('should read the client id from the old cookie', function () {
      document.cookie = 'ConstructorioAB_client_id=tummyid; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';
      var session = new ConstructorioID();
      expect(session.client_id).to.equal('tummyid');
      expect(document.cookie).to.equal('ConstructorioID_client_id=tummyid');
    });

    it('should read the client id from the new cookie', function () {
      document.cookie = 'ConstructorioID_client_id=bummyid; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';
      var session = new ConstructorioID();
      expect(session.client_id).to.equal('bummyid');
      expect(document.cookie).to.equal('ConstructorioID_client_id=bummyid');
    });

    it('should set the client id if missing', function () {
      var session = new ConstructorioID({ cookie_name: 'missingname' });
      expect(session.client_id).to.be.a.string;
      expect(session.client_id).to.match(/(\w|d|-){36}/);
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
    });

    it('should set session_is_new to true if there is no local storage data', function () {
      var session = new ConstructorioID();
      expect(session.session_is_new).to.be.a('boolean');
      expect(session.session_is_new).to.equal(true);
    });

    it('should set the user agent', function () {
      var session = new ConstructorioID();
      expect(session.user_agent).to.match(/jsdom/);
    });

    it('should set node status to false', function () {
      var session = new ConstructorioID();
      expect(session.on_node).to.be.false;
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
  });
});
