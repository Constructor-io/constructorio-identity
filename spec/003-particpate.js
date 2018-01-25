var expect = require('chai').expect;
var jsdom = require('jsdom');
var sinon  = require('sinon');
var ConstructorioID = require('../src/constructorio-id.js');

describe('ConstructorioID', function () {
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
      var session = new ConstructorioID();
      session.participate('testing', [], function (err, resp) {
        expect(err).instanceof(Error);
        expect(err.message).to.match(/^Must specify at least 2 alternatives$/);
        expect(resp).to.be.undefined;
        done();
      });
    });

    it('should return an error if one alternative is passed in', function (done) {
      var session = new ConstructorioID();
      session.participate('testing', ['one'], function (err, resp) {
        expect(err).instanceof(Error);
        expect(err.message).to.match(/^Must specify at least 2 alternatives$/);
        expect(resp).to.be.undefined;
        done();
      });
    });

    it('should return an error if an alternative has a bad name', function (done) {
      var session = new ConstructorioID();
      session.participate('show-bieber', ['trolled', '%%'], function (err, resp) {
        expect(resp).to.be.undefined;
        expect(err.message).to.match(/^Bad alternative name/);
        expect(err).instanceof(Error);
        done();
      });
    });

    it('should return an error if the experiment has a bad name', function (done) {
      var session = new ConstructorioID();
      session.participate('%%', ['trolled', 'not-trolled'], function (err, resp) {
        expect(resp).to.be.undefined;
        expect(err.message).to.match(/^Bad experiment_name$/);
        expect(err).instanceof(Error);
        done();
      });
    });

    it('should throw an error if no callback is defined', function (done) {
      var session = new ConstructorioID();
      expect(function () {
        session.participate('show-bieber', ['trolled', 'not-trolled']);
      }).to.throw(
        Error, /^Callback is not specified$/
      );
      done();
    });

    it('should return an alternative from cookie', function (done) {
      var session = new ConstructorioID();
      var request = sinon.stub(ConstructorioID.prototype, '_request').callsFake(function fakeFn(uri, params, timeout, callback) {
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
      var session = new ConstructorioID({ ip_address: '1.1.1.1' });
      var request = sinon.stub(ConstructorioID.prototype, '_request').callsFake(function fakeFn(uri, params, timeout, callback) {
        callback(null, { status: 'ok', alternative: { name: 'trolled`' }, experiment: { name: 'show-bieber' } });
      });
      var requestParams = {
        client_id: session.client_id,
        experiment: 'show-bieber',
        ip_address: '1.1.1.1',
        user_agent: 'Mozilla/5.0 (darwin) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/11.5.1',
        alternatives: [ 'trolled', 'not-trolled' ]
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

    it('should request an alternative with no cookie and traffic fraction', function (done) {
      var session = new ConstructorioID();
      var request = sinon.stub(ConstructorioID.prototype, '_request').callsFake(function fakeFn(uri, params, timeout, callback) {
        callback(null, { status: 'ok', alternative: { name: 'trolled`' }, experiment: { name: 'show-bieber-fraction' } });
      });
      var requestParams = {
        client_id: session.client_id,
        experiment: 'show-bieber-fraction',
        traffic_fraction: 0.1,
        user_agent: 'Mozilla/5.0 (darwin) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/11.5.1',
        alternatives: [ 'trolled', 'not-trolled' ]
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

    it('should issue a second request using particpate fail on failure', function (done) {
      var session = new ConstructorioID({ ip_address: '1.1.1.1' });
      var request = sinon.stub(ConstructorioID.prototype, '_request').callsFake(function fakeFn(uri, params, timeout, callback) {
        callback(new Error('whoops'));
      });

      session.participate('show-bieber', ['trolled', 'not-trolled'], function (err, resp) {
        expect(err).to.be.null;
        expect(resp.status).to.equal('failed');
        expect(resp.alternative.name).to.match(/trolled/);
        expect(resp.error.message).to.match(/whoops/);
        expect(request.calledTwice).to.be.true;
        expect(request.getCall(1).args[1]['participate-fail']).to.be.a.number;
        request.restore();
        done();
      });
    });

    it('should override cookies when using force', function (done) {
      var session = new ConstructorioID();
      var request = sinon.stub(ConstructorioID.prototype, '_request').callsFake(function fakeFn(uri, params, timeout, callback) {
        callback(null);
      });
      document.cookie = session.cookie_prefix_for_experiment + 'show-bieber=not-trolled; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';

      session.participate('show-bieber', ['trolled', 'not-trolled'], 'trolled', function (err, resp) {
        expect(err).to.be.null;
        expect(resp.status).to.equal('ok');
        expect(resp.alternative.name).to.match(/trolled/);
        expect(resp.experiment.name).to.match(/show-bieber/);
        expect(request.called).to.be.false;
        request.restore();
        done();
      });
    });

    it('should not request an alternative when using force', function (done) {
      var session = new ConstructorioID();
      var request = sinon.stub(ConstructorioID.prototype, '_request').callsFake(function fakeFn(uri, params, timeout, callback) {
        callback(null);
      });

      session.participate('show-bieber', ['trolled', 'not-trolled'], 'trolled', function (err, resp) {
        expect(err).to.be.null;
        expect(resp.status).to.equal('ok');
        expect(resp.alternative.name).to.match(/trolled/);
        expect(resp.experiment.name).to.match(/show-bieber/);
        expect(request.called).to.be.false;
        request.restore();
        done();
      });
    });

    it('should not request an alternative when using force from the querystring', function (done) {
      var dom = new jsdom.JSDOM('', { url: 'http://h1b.io/welcome?ConstructorioID-force-show-bieber=trolled' });
      global.window = dom.window;
      global.document = dom.window.document;
      var session = new ConstructorioID();
      var request = sinon.stub(ConstructorioID.prototype, '_request').callsFake(function fakeFn(uri, params, timeout, callback) {
        callback(null);
      });

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
  });
});
