var expect = require('chai').expect;
var jsdom = require('jsdom');
var sinon  = require('sinon');
var helper = require('./helper');
var ConstructorioID = require('../src/constructorio-id.js');

describe('ConstructorioID', function () {
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

  describe('get_local_object', function () {
    it('should not return a local string', function () {
      window.localStorage.setItem('adventuretime', 'Come on grab your friends');
      var session = new ConstructorioID();
      var adventuretime = session.get_local_object('adventuretime');
      expect(adventuretime).to.equal('Come on grab your friends');
    });
  });

  describe('set_local_object', function () {
    it('should set a local string', function () {
      var session = new ConstructorioID();
      session.set_local_object('adventuretime', 'bmo');
      expect(window.localStorage.adventuretime).to.be.a.string;
      expect(window.localStorage.adventuretime).to.deep.equal('bmo');
    });
  });

  describe('generate_session_id', function () {
    it('should return a session id from local storage if recent', function () {
      var now = Date.now();
      var session = new ConstructorioID();
      var sessionId = 42;
      var lastTime = Date.now();
      window.localStorage.clear();
      window.localStorage.setItem('_constructorio_search_session', sessionId + '|' + lastTime);

      var set_local_object = sinon.spy(ConstructorioID.prototype, 'set_local_object');
      var session_id = session.generate_session_id();
      expect(session_id).to.be.a('number');
      expect(session_id).to.equal(42);
      expect(set_local_object.calledOnce).to.be.true;
      expect(set_local_object.calledWith('_constructorio_search_session')).to.be.true;
      var callArgsSplit = set_local_object.getCall(0).args[1].split('|');
      expect(parseInt(callArgsSplit[0], 10)).to.equal(42);
      expect(parseInt(callArgsSplit[1], 10)).to.be.at.least(now);

      set_local_object.restore();
    });

    it('should return the same session id from cookie if recent and the storage location is set to cookie', function () {
      var now = Date.now();
      var session = new ConstructorioID({ session_id_storage_location: 'cookie' });
      var sessionId = 42;
      document.cookie = `ConstructorioID_session_id=${sessionId}|${now}; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/`;

      var set_cookie = sinon.spy(ConstructorioID.prototype, 'set_cookie');
      var session_id = session.generate_session_id();
      expect(session_id).to.be.a('number');
      expect(session_id).to.equal(42);
      expect(set_cookie.calledOnce).to.be.true;
      expect(set_cookie.calledWith('ConstructorioID_session_id')).to.be.true;
      var callArgsSplit = set_cookie.getCall(0).args[1].split('|');
      expect(parseInt(callArgsSplit[0], 10)).to.equal(42);
      expect(parseInt(callArgsSplit[1], 10)).to.be.at.least(now);

      set_cookie.restore();
    });

    it('should increment session id in local storage if older than thirty minutes', function () {
      var now = Date.now();
      var session = new ConstructorioID();
      var sessionId = 42;
      var lastTime = Date.now() - 1000 * 60 * 30;
      window.localStorage.clear();
      window.localStorage.setItem('_constructorio_search_session', sessionId + '|' + lastTime);

      var set_local_object = sinon.spy(ConstructorioID.prototype, 'set_local_object');
      var session_id = session.generate_session_id();
      expect(session_id).to.be.a('number');
      expect(session_id).to.equal(43);
      expect(set_local_object.calledOnce).to.be.true;
      expect(set_local_object.calledWith('_constructorio_search_session')).to.be.true;
      var callArgsSplit = set_local_object.getCall(0).args[1].split('|');
      expect(parseInt(callArgsSplit[0], 10)).to.equal(43);
      expect(parseInt(callArgsSplit[1], 10)).to.be.at.least(now);

      set_local_object.restore();
    });

    it('should increment session id from cookie if older than thirty minutes and storage location is set to cookie', function () {
      var now = Date.now();
      var session = new ConstructorioID({ session_id_storage_location: 'cookie' });
      var sessionId = 42;
      var lastTime = Date.now() - 1000 * 60 * 30;
      document.cookie = `ConstructorioID_session_id=${sessionId}|${lastTime}; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/`;

      var set_cookie = sinon.spy(ConstructorioID.prototype, 'set_cookie');
      var session_id = session.generate_session_id();
      expect(session_id).to.be.a('number');
      expect(session_id).to.equal(43);
      expect(set_cookie.calledOnce).to.be.true;
      expect(set_cookie.calledWith('ConstructorioID_session_id')).to.be.true;
      var callArgsSplit = set_cookie.getCall(0).args[1].split('|');
      expect(parseInt(callArgsSplit[0], 10)).to.equal(43);
      expect(parseInt(callArgsSplit[1], 10)).to.be.at.least(now);

      set_cookie.restore();
    });

    it('should set a session id in local storage if missing', function () {
      var now = Date.now();
      var session = new ConstructorioID();
      window.localStorage.clear();

      var set_local_object = sinon.spy(ConstructorioID.prototype, 'set_local_object');
      var session_id = session.generate_session_id();
      expect(session_id).to.be.a('number');
      expect(session_id).to.equal(1);
      expect(set_local_object.calledOnce).to.be.true;
      expect(set_local_object.calledWith('_constructorio_search_session')).to.be.true;
      var callArgsSplit = set_local_object.getCall(0).args[1].split('|');
      expect(parseInt(callArgsSplit[0], 10)).to.equal(1);
      expect(parseInt(callArgsSplit[1], 10)).to.be.at.least(now);
      set_local_object.restore();
    });

    it('should set a session id in cookie if missing and storage location is set to cookie', function () {
      var now = Date.now();
      var session = new ConstructorioID({ session_id_storage_location: 'cookie' });
      document.cookie = '';

      var set_cookie = sinon.spy(ConstructorioID.prototype, 'set_cookie');
      var session_id = session.generate_session_id();
      expect(session_id).to.be.a('number');
      expect(session_id).to.equal(1);
      expect(set_cookie.calledOnce).to.be.true;
      expect(set_cookie.calledWith('ConstructorioID_session_id')).to.be.true;
      var callArgsSplit = set_cookie.getCall(0).args[1].split('|');
      expect(parseInt(callArgsSplit[0], 10)).to.equal(1);
      expect(parseInt(callArgsSplit[1], 10)).to.be.at.least(now);
      set_cookie.restore();
    });
  });
});
