var assert = require('chai').assert;
var expect = require('chai').expect;
var sinon  = require('sinon');
var jsdom = require('jsdom');
var ConstructorioAB = require('../src/constructorio-ab.js');

describe('ConstructorioAB', function () {
  before(function () {
    var dom = new jsdom.JSDOM();
    global.window = dom.window;
    global.document = dom.window.document;
    ConstructorioAB.Session.prototype.get_cookie = sinon.stub().returns('trolled');
    ConstructorioAB.Session.prototype.set_cookie = sinon.stub();
  });

  after(function () {
    ConstructorioAB.Session.prototype.get_cookie.restore();
    ConstructorioAB.Session.prototype.set_cookie.restore();
  });

  it('should return an alternative for participate', function (done) {
    var session = new ConstructorioAB.Session();
    session.participate('show-bieber', ['trolled', 'not-trolled'], function (err, resp) {
      expect(resp.alternative.name).to.match(/trolled/);
      expect(ConstructorioAB.Session.prototype.get_cookie.calledWithMatch('ConstructorioAB_experiment_show-bieber'));
      expect(ConstructorioAB.Session.prototype.set_cookie.calledWithMatch('ConstructorioAB_experiment_show-bieber', /trolled/));
      done();
    });
  });

  it('should return ok for participate with traffic_fraction', function (done) {
    var session = new ConstructorioAB.Session();
    session.participate('show-bieber-fraction', ['trolled', 'not-trolled'], 0.1, function (err, resp) {
      expect(resp.status).to.equal('ok');
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

  it('should auto generate a client_id', function (done) {
    var session = new ConstructorioAB.Session();
    expect(session.client_id.length).to.equal(36);
    done();
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
      assert.equal(alt, null);
      expect(err).instanceof(Error);
      done();
    });
  });

  it('should not allow bad alternative names', function (done) {
    var session = new ConstructorioAB.Session();
    session.participate('show-bieber', ['trolled'], function (err, alt) {
      assert.equal(alt, null);
      expect(err).instanceof(Error);

      session.participate('show-bieber', ['trolled', '%%'], function (err, alt) {
        assert.equal(alt, null);
        expect(err).instanceof(Error);
        done();
      });
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

  it('should throw an error when callback is undefined', function (done) {
    var session = new ConstructorioAB.Session();
    session.client_id = 'mike';
    expect(function () {
      session.participate('show-bieber', ['trolled', 'not-trolled']);
    }).to.throw(
      Error, /^Callback is not specified$/
    );

    done();
  });

  it('should throw an error if less than 2 alternatives are passed in', function (done) {
    var session = new ConstructorioAB.Session();
    session.participate('testing', [], function (err, resp) {
      expect(err.message).to.match(/^Must specify at least 2 alternatives$/);
      done();
    });
  });

  it('should get the alternative name from a cookie when participate is called a second time', function (done) {
    var session = new ConstructorioAB.Session();
    session.participate('show-bieber', ['trolled', 'not-trolled'], function (err, resp) {
      session._request = sinon.stub();
      session.participate('show-bieber', ['trolled', 'not-trolled'], function (err, resp) {
        expect(resp.alternative.name).to.equal('trolled');
        expect(session._request.notCalled).to.be.true;
        done();
      });
    });
  });
});
