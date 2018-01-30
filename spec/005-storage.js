var expect = require('chai').expect;
var jsdom = require('jsdom');
var helper = require('./helper');
var ConstructorioID = require('../src/constructorio-id.js');

describe('ConstructorioID', function () {
  beforeEach(function () {
    var dom = new jsdom.JSDOM();
    global.window = dom.window;
    global.window.localStorage = helper.getStorageMock();
    global.document = dom.window.document;
  });

  afterEach(function () {
    delete global.window;
    delete global.document;
  });

  describe('get_local_object', function () {
    it('should return a local object', function () {
      window.localStorage.setItem('adventuretime', JSON.stringify({ finn: true, jake: true }));
      var session = new ConstructorioID();
      var adventuretime = session.get_local_object('adventuretime');
      expect(adventuretime.finn).to.be.true;
      expect(adventuretime.jake).to.be.true;
    });

    it('should not return a non-object', function () {
      window.localStorage.setItem('adventuretime', 'Come on grab your friends');
      var session = new ConstructorioID();
      var adventuretime = session.get_local_object('adventuretime');
      expect(adventuretime).to.be.undefined;
    });
  });

  describe('set_local_object', function () {
    it('should set a local object', function () {
      var session = new ConstructorioID();
      session.set_local_object('adventuretime', { marceline: true });
      expect(window.localStorage._data.adventuretime).to.be.a.string;
      expect(JSON.parse(window.localStorage._data.adventuretime)).to.deep.equal({ marceline: true });
    });

    it('should not set a non-object', function () {
      var session = new ConstructorioID();
      session.set_local_object('adventuretime', 'We\'re going to very distant lands.');
      expect(window.localStorage._data.adventuretime).to.be.undefined;
    });
  });

  describe('get_session_id', function () {
    it('should return a session id from local storage if recent', function () {
      window.localStorage.setItem('_constructorio_search_session', JSON.stringify({
        sessionId: 42,
        lastTime: Date.now()
      }));
      var session = new ConstructorioID();
      expect(session.session_id).to.be.a.number;
      expect(session.session_id).to.equal(42);
    });

    it('should increment session id from local storage if older than thirty minutes', function () {
      window.localStorage.setItem('_constructorio_search_session', JSON.stringify({
        sessionId: 42,
        lastTime: Date.now() - 1000 * 60 * 30
      }));
      var session = new ConstructorioID();
      expect(session.session_id).to.be.a.number;
      expect(session.session_id).to.equal(43);
    });

    it('should set a session id from local storage if missing', function () {
      var session = new ConstructorioID();
      var sessionData = window.localStorage.getItem('_constructorio_search_session');
      expect(session.session_id).to.be.a.number;
      expect(session.session_id).to.equal(1);
      expect(sessionData).to.be.an.object;
    });
  });
});
