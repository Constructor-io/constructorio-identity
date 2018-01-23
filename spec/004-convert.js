var expect = require('chai').expect;
var jsdom = require('jsdom');
var sinon  = require('sinon');
var ConstructorioAB = require('../src/constructorio-ab.js');

describe('ConstructorioAB', function () {
  describe('convert', function () {
    beforeEach(function () {
      var dom = new jsdom.JSDOM();
      global.window = dom.window;
      global.document = dom.window.document;
    });

    afterEach(function () {
      delete global.window;
      delete global.document;
    });

    it('should throw an error if no callback is defined', function (done) {
      var session = new ConstructorioAB();
      expect(function () {
        session.convert('show-bieber');
      }).to.throw(
        Error, /^Callback is not specified$/
      );
      done();
    });

    it('should return an error if an experiment has a bad name', function (done) {
      var session = new ConstructorioAB();
      session.convert('%%', function (err, resp) {
        expect(err).instanceof(Error);
        expect(err.message).to.match(/^Bad experiment_name$/);
        expect(resp).to.be.undefined;
        done();
      });
    });

    it('should return ok for convert', function (done) {
      var session = new ConstructorioAB();
      var request = sinon.stub(ConstructorioAB.prototype, '_request').callsFake(function fakeFn(uri, params, timeout, callback) {
        callback(null, { status: 'ok' });
      });
      var requestParams = {
        client_id: session.client_id,
        experiment: 'show-bieber',
        user_agent: 'Mozilla/5.0 (darwin) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/11.5.1'
      };

      session.convert('show-bieber', function (err, resp) {
        expect(err).to.be.null;
        expect(resp.status).to.equal('ok');
        expect(request.called).to.be.true;
        expect(request.getCall(0).args[1]).to.deep.equal(requestParams);
        request.restore();
        done();
      });
    });

    it('should return ok for convert with kpi', function (done) {
      var session = new ConstructorioAB({ ip_address: '1.1.1.1' });
      var request = sinon.stub(ConstructorioAB.prototype, '_request').callsFake(function fakeFn(uri, params, timeout, callback) {
        callback(null, { status: 'ok' });
      });
      var requestParams = {
        client_id: session.client_id,
        experiment: 'show-bieber',
        ip_address: '1.1.1.1',
        kpi: 'paparazzi shot',
        user_agent: 'Mozilla/5.0 (darwin) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/11.5.1'
      };

      session.convert('show-bieber', 'paparazzi shot', function (err, resp) {
        expect(err).to.be.null;
        expect(resp.status).to.equal('ok');
        expect(request.called).to.be.true;
        expect(request.getCall(0).args[1]).to.deep.equal(requestParams);
        request.restore();
        done();
      });
    });

    it('should return an error on failure', function (done) {
      var session = new ConstructorioAB();
      var request = sinon.stub(ConstructorioAB.prototype, '_request').callsFake(function fakeFn(uri, params, timeout, callback) {
        callback(new Error('whoops'));
      });

      session.convert('show-bieber', 'paparazzi shot', function (err, resp) {
        expect(err).to.be.null;
        expect(resp.status).to.equal('failed');
        expect(resp.error.message).to.match(/whoops/);
        request.restore();
        done();
      });
    });
  });
});
