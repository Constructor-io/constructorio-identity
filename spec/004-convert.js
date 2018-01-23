var expect = require('chai').expect;
var jsdom = require('jsdom');
var ConstructorioAB = require('../src/constructorio-ab.js');

describe('ConstructorioAB.Session', function () {
  describe('convert', function () {
    before(function () {
      var dom = new jsdom.JSDOM();
      global.window = dom.window;
      global.document = dom.window.document;
    });

    afterEach(function () {
      delete global.window;
      delete global.document;
    });

    it('should throw an error if no callback is defined', function (done) {
      var session = new ConstructorioAB.Session();
      expect(function () {
        session.convert('show-bieber');
      }).to.throw(
        Error, /^Callback is not specified$/
      );
      done();
    });

    it('should return an error if an experiment has a bad name', function (done) {
      var session = new ConstructorioAB.Session();
      session.convert('%%', function (err, resp) {
        expect(err).instanceof(Error);
        expect(err.message).to.match(/^Bad experiment_name$/);
        expect(resp).to.be.undefined;
        done();
      });
    });

    it('should return ok for convert', function (done) {
      var session = new ConstructorioAB.Session();
      session.client_id = 'mike';
      session.participate('show-bieber', ['trolled', 'not-trolled'], function (err, resp) {
        session.convert('show-bieber', function (err, resp) {
          expect(resp.status).to.equal('ok');
          done();
        });
      });
    });

    it('should return ok for convert with kpi', function (done) {
      var session = new ConstructorioAB.Session();
      session.client_id = 'mike';
      session.participate('show-bieber', ['trolled', 'not-trolled'], function (err, resp) {
        session.convert('show-bieber', function (err, resp) {
          expect(resp.status).to.equal('ok');
          done();
        });
      });
    });
  });
});
