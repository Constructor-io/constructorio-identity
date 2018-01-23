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

    it('should return ok for multiple converts', function (done) {
      var session = new ConstructorioAB.Session();
      session.client_id = 'mike';
      session.participate('show-bieber', ['trolled', 'not-trolled'], function (err, alt) {
        session.convert('show-bieber', function (err, resp) {
          expect(resp.status).to.equal('ok');
          session.convert('show-bieber', function (err, alt) {
            expect(resp.status).to.equal('ok');
            done();
          });
        });
      });
    });

    it('should not return ok for convert with new client_id', function (done) {
      var session = new ConstructorioAB.Session();
      session.client_id = 'unknown_idizzle';
      session.convert('show-bieber', function (err, resp) {
        expect(resp.status).to.equal('failed');
        done();
      });
    });

    it('should not return ok for convert with new experiment', function (done) {
      var session = new ConstructorioAB.Session();
      session.convert('show-blieber', function (err, resp) {
        // TODO should this be an err?
        expect(resp.status).to.equal('failed');
        done();
      });
    });

    it('should return ok for convert with kpi', function (done) {
      var session = new ConstructorioAB.Session();
      session.client_id = 'mike';
      session.convert('show-bieber', 'justin-shown', function (err, resp) {
        expect(resp.status).to.equal('ok');
        done();
      });
    });

    it('should not allow bad experiment names', function (done) {
      var session = new ConstructorioAB.Session();
      session.participate('%%', ['trolled', 'not-trolled'], function (err, alt) {
        expect(alt).to.be.null;
        expect(err).instanceof(Error);
        done();
      });
    });

    it('should work without using the simple methods', function (done) {
      var session = new ConstructorioAB.Session();
      session.convert('testing', function (err, res) {
        expect(res.status).equal('failed');

        session.participate('testing', ['one', 'two'], function (err, res) {
          var alt1 = res.alternative.name;
          var old_id = session.client_id;
          session.client_id = ConstructorioAB.generate_client_id();

          session.convert('testing', function (err, res) {
            expect(res.status).equal('failed');

            session.participate('testing', ['one', 'two'], function (err, res) {
              session.client_id = old_id;

              session.participate('testing', ['one', 'two'], function (err, res) {
                expect(res.alternative.name).to.equal(alt1);
                done();
              });
            });
          });
        });
      });
    });

    it('should return an error when experiment_name is incorrect', function (done) {
      var session = new ConstructorioAB.Session();
      session.client_id = 'mike';
      session.participate(undefined, ['trolled', 'not-trolled'], function (err, resp) {
        expect(err).to.be.an.instanceof(Error);
        expect(err.message).to.equal('Bad experiment_name');

        session.convert(undefined, function (err, resp) {
          expect(err).to.be.an.instanceof(Error);
          expect(err.message).to.equal('Bad experiment_name');
          done();
        });
      });
    });
  });
});
