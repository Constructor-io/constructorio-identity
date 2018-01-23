var expect = require('chai').expect;
var sinon  = require('sinon');
var jsdom = require('jsdom');
var ConstructorioAB = require('../src/constructorio-ab.js');

describe('ConstructorioAB.Session', function () {
  describe('particpate', function () {
    beforeEach(function () {
      var dom = new jsdom.JSDOM();
      global.window = dom.window;
      global.document = dom.window.document;
    });

    afterEach(function () {
      delete global.window;
      delete global.document;
    });

    it('should return an error if zero alternatives are passed in', function (done) {
      var session = new ConstructorioAB.Session();
      session.participate('testing', [], function (err, resp) {
        expect(err.message).to.match(/^Must specify at least 2 alternatives$/);
        expect(resp).to.be.undefined;
        done();
      });
    });

    it('should return an error if one alternative is passed in', function (done) {
      var session = new ConstructorioAB.Session();
      session.participate('testing', ['one'], function (err, resp) {
        expect(err.message).to.match(/^Must specify at least 2 alternatives$/);
        expect(resp).to.be.undefined;
        done();
      });
    });

    it('should return an error if an alternative has a bad name', function (done) {
      var session = new ConstructorioAB.Session();
      session.participate('show-bieber', ['trolled', '%%'], function (err, resp) {
        expect(resp).to.be.undefined;
        expect(err).instanceof(Error);
        done();
      });
    });

    it('should throw an error if no callback is defined', function (done) {
      var session = new ConstructorioAB.Session();
      expect(function () {
        session.participate('show-bieber', ['trolled', 'not-trolled']);
      }).to.throw(
        Error, /^Callback is not specified$/
      );
      done();
    });

    it('should return an alternative from cookie', function (done) {
      var session = new ConstructorioAB.Session();
      var request = sinon.stub(ConstructorioAB.Session.prototype, '_request').callsFake(function fakeFn(uri, params, timeout, callback) {
        callback(null);
      });
      document.cookie = session.cookie_prefix_for_experiment + 'show-bieber=trolled; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';

      session.participate('show-bieber', ['trolled', 'not-trolled'], function (err, resp) {
        expect(err).to.be.null;
        expect(resp.status).to.equal('ok');
        expect(resp.alternative.name).to.match(/trolled/);
        expect(resp.experiment.name).to.match(/show-bieber/);
        expect(request.called).to.be.false;
        request.restore();
        done();
      });
    });

    it('should request an alternative with no cookie', function (done) {
      var session = new ConstructorioAB.Session();
      var request = sinon.stub(ConstructorioAB.Session.prototype, '_request').callsFake(function fakeFn(uri, params, timeout, callback) {
        callback(null, { status: 'ok', alternative: { name: 'trolled`' }, experiment: { name: 'show-bieber' } });
      });
      var requestParams = {
        client_id: session.client_id,
        experiment: 'show-bieber',
        alternatives: [ 'trolled', 'not-trolled' ],
        user_agent: 'Mozilla/5.0 (darwin) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/11.5.1'
      };

      session.participate('show-bieber', ['trolled', 'not-trolled'], function (err, resp) {
        expect(err).to.be.null;
        expect(resp.status).to.equal('ok');
        expect(resp.alternative.name).to.match(/trolled/);
        expect(resp.experiment.name).to.match(/show-bieber/);
        expect(request.called).to.be.true;
        expect(request.getCall(0).args[1]).to.deep.equal(requestParams);
        request.restore();
        done();
      });
    });

    it('should request an alternative with no cookie an traffic fraction', function (done) {
      var session = new ConstructorioAB.Session();
      var request = sinon.stub(ConstructorioAB.Session.prototype, '_request').callsFake(function fakeFn(uri, params, timeout, callback) {
        callback(null, { status: 'ok', alternative: { name: 'trolled`' }, experiment: { name: 'show-bieber-fraction' } });
      });
      var requestParams = {
        client_id: session.client_id,
        experiment: 'show-bieber-fraction',
        alternatives: [ 'trolled', 'not-trolled' ],
        traffic_fraction: 0.1,
        user_agent: 'Mozilla/5.0 (darwin) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/11.5.1'
      };

      session.participate('show-bieber-fraction', ['trolled', 'not-trolled'], 0.1, function (err, resp) {
        expect(err).to.be.null;
        expect(resp.status).to.equal('ok');
        expect(resp.alternative.name).to.match(/trolled/);
        expect(resp.experiment.name).to.match(/show-bieber-fraction/);
        expect(request.called).to.be.true;
        expect(request.getCall(0).args[1]).to.deep.equal(requestParams);
        request.restore();
        done();
      });
    });

    it('should return forced alternative for participate with force', function (done) {
      var session = new ConstructorioAB.Session();
      session.participate('show-bieber', ['trolled', 'not-trolled'], 'trolled', function (err, resp) {
        expect(resp.alternative.name).to.equal('trolled');
        session.participate('show-bieber', ['trolled', 'not-trolled'], 'not-trolled', function (err, resp) {
          expect(resp.alternative.name).to.equal('not-trolled');
          done();
        });
      });
    });

    it('should return ok and forced alternative for participate with traffic_fraction and force', function (done) {
      var session = new ConstructorioAB.Session();
      session.participate('show-bieber-fraction', ['trolled', 'not-trolled'], 0.1, 'trolled', function (err, resp) {
        expect(resp.status).to.equal('ok');
        expect(resp.alternative.name).to.equal('trolled');
        session.participate('show-bieber-fraction', ['trolled', 'not-trolled'], 0.1, 'not-trolled', function (err, resp) {
          expect(resp.status).to.equal('ok');
          expect(resp.alternative.name).to.equal('not-trolled');
          done();
        });
      });
    });
  });
});
