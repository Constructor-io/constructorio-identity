var expect = require('chai').expect;
var jsdom = require('jsdom');
var sinon  = require('sinon');
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
    it('should return a local object', function (done) {
      window.localStorage.setItem('adventuretime', JSON.stringify({ finn: true, jake: true }));
      var session = new ConstructorioID();
      var adventuretime = session.get_local_object('adventuretime');
      expect(adventuretime.finn).to.be.true;
      expect(adventuretime.jake).to.be.true;
      done();
    });

    it('should not return a non-object', function (done) {
      window.localStorage.setItem('adventuretime', 'Come on grab your friends');
      var session = new ConstructorioID();
      var adventuretime = session.get_local_object('adventuretime');
      expect(adventuretime).to.be.undefined;
      done();
    });
  });

  describe('set_local_object', function () {
    it('should set a local object', function (done) {
      var session = new ConstructorioID();
      session.set_local_object('adventuretime', { marceline: true });
      expect(window.localStorage._data.adventuretime).to.be.a.string;
      expect(JSON.parse(window.localStorage._data.adventuretime)).to.deep.equal({ marceline: true });
      done();
    });

    it('should not set a non-object', function (done) {
      var session = new ConstructorioID();
      session.set_local_object('adventuretime', 'We\'re going to very distant lands.');
      expect(window.localStorage._data.adventuretime).to.be.undefined;
      done();
    });
  });

  describe('get_session_id', function () {
    it('should return a session id from local storage if recent', function (done) {
      var session = new ConstructorioID();
      window.localStorage.clear();
      window.localStorage.setItem('_constructorio_search_session', JSON.stringify({
        sessionId: 42,
        lastTime: Date.now()
      }));

      var set_local_object = sinon.spy(ConstructorioID.prototype, 'set_local_object');
      var session_id = session.get_session_id();
      expect(session_id).to.be.a.number;
      expect(session_id).to.equal(42);
      expect(set_local_object.calledOnce).to.be.true;
      expect(set_local_object.calledWith('_constructorio_search_session')).to.be.true;

      set_local_object.restore();
      done();
    });

    it('should increment session id from local storage if older than thirty minutes', function (done) {
      var session = new ConstructorioID();
      window.localStorage.clear();
      window.localStorage.setItem('_constructorio_search_session', JSON.stringify({
        sessionId: 42,
        lastTime: Date.now() - 1000 * 60 * 30
      }));

      var set_local_object = sinon.spy(ConstructorioID.prototype, 'set_local_object');
      var session_id = session.get_session_id();
      expect(session_id).to.be.a.number;
      expect(session_id).to.equal(43);
      expect(set_local_object.calledOnce).to.be.true;
      expect(set_local_object.calledWith('_constructorio_search_session')).to.be.true;

      set_local_object.restore();
      done();
    });

    it('should set a session id from local storage if missing', function (done) {
      var session = new ConstructorioID();
      window.localStorage.clear();

      var set_local_object = sinon.spy(ConstructorioID.prototype, 'set_local_object');
      var session_id = session.get_session_id();
      expect(session_id).to.be.a.number;
      expect(session_id).to.equal(1);
      expect(set_local_object.calledOnce).to.be.true;
      expect(set_local_object.calledWith('_constructorio_search_session')).to.be.true;

      set_local_object.restore();
      done();
    });
  });
});
