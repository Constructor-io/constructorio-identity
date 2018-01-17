var mocha  = require('mocha');
var assert = require('chai').assert;
var expect = require('chai').expect;
var sinon  = require('sinon');
var ConstructorioAB = require('../src/constructorio-ab.js');

describe("ConstructorioAB", function () {
    var session;

    before(function () {
        ConstructorioAB.get_cookie = sinon.stub().returns("trolled");
        ConstructorioAB.set_cookie = sinon.stub();
    });

    after(function() {
        // these give "TypeError: undefined is not a function"
        // and I don't know why
        // ConstructorioAB.get_cookie.restore();
        // ConstructorioAB.set_cookie.restore();
    });

    beforeEach( function() {
        session = new ConstructorioAB.Session();

        // Override default base_url when the ConstructorioAB_BASE_URL
        // environment variable is found.
        if (process.env.CONSTRUCTORIOAB_BASE_URL) {
            session.base_url = process.env.CONSTRUCTORIOAB_BASE_URL;
        }
    });

    it("should return an alternative for participate", function (done) {
        session.participate("show-bieber", ["trolled", "not-trolled"], function(err, resp) {
            if (err) throw err;
            expect(resp.alternative.name).to.match(/trolled/);
            expect(ConstructorioAB.get_cookie.calledWithMatch('ConstructorioAB_experiment_show-bieber'));
            expect(ConstructorioAB.set_cookie.calledWithMatch('ConstructorioAB_experiment_show-bieber', /trolled/));
            done();
        });
    });

    it("should return ok for participate with traffic_fraction", function (done) {
        session.participate("show-bieber-fraction", ["trolled", "not-trolled"], 0.1, function(err, resp) {
            if (err) throw err;
            expect(resp.status).to.equal("ok");
            done();
        });
    });

    it("should return forced alternative for participate with force", function (done) {
        session.participate("show-bieber", ["trolled", "not-trolled"], "trolled", function(err, resp) {
            if (err) throw err;
            expect(resp.alternative.name).to.equal("trolled");
            session.participate("show-bieber", ["trolled", "not-trolled"], "not-trolled", function(err, resp) {
                if (err) throw err;
                expect(resp.alternative.name).to.equal("not-trolled");
                done();
            });
        });
    });

    it("should return ok and forced alternative for participate with traffic_fraction and force", function (done) {
        session.participate("show-bieber-fraction", ["trolled", "not-trolled"], 0.1, "trolled", function(err, resp) {
            if (err) throw err;
            expect(resp.status).to.equal("ok");
            expect(resp.alternative.name).to.equal("trolled");
            session.participate("show-bieber-fraction", ["trolled", "not-trolled"], 0.1, "not-trolled", function(err, resp) {
                if (err) throw err;
                expect(resp.status).to.equal("ok");
                expect(resp.alternative.name).to.equal("not-trolled");
                done();
            });
        });
    });

    it("should auto generate a client_id", function (done) {
        expect(session.client_id.length).to.equal(36);
        done();
    });

    it("should return ok for convert", function (done) {
        session.client_id = "mike";
        session.participate("show-bieber", ["trolled", "not-trolled"], function(err, resp) {
            if (err) throw err;
            session.convert("show-bieber", function(err, resp) {
                if (err) throw err;
                expect(resp.status).to.equal("ok");
                done();
            });
        });
    });

    it("should return ok for multiple converts", function (done) {
        session.client_id = "mike";
        session.participate("show-bieber", ["trolled", "not-trolled"], function(err, alt) {
            if (err) throw err;
            session.convert("show-bieber", function(err, resp) {
                if (err) throw err;
                expect(resp.status).to.equal("ok");
                session.convert("show-bieber", function(err, alt) {
                    if (err) throw err;
                    expect(resp.status).to.equal("ok");
                    done();
                });
            });
        });
    });

    it("should not return ok for convert with new client_id", function (done) {
        session.client_id = "unknown_idizzle";
        session.convert("show-bieber", function(err, resp) {
            if (err) throw err;
            expect(resp.status).to.equal("failed");
            done();
        });
    });

    it("should not return ok for convert with new experiment", function (done) {
        session.convert("show-blieber", function(err, resp) {
            // TODO should this be an err?
            if (err) throw err;
            expect(resp.status).to.equal("failed");
            done();
        });
    });

    it("should return ok for convert with kpi", function (done) {
        session.client_id = "mike";
        session.convert("show-bieber", "justin-shown", function(err, resp) {
            if (err) throw err;
            expect(resp.status).to.equal("ok");
            done();
        });
    });

    it("should not allow bad experiment names", function (done) {
        session.participate("%%", ["trolled", "not-trolled"], function(err, alt) {
            assert.equal(alt, null);
            expect(err).instanceof(Error);
            done();
        });
    });

    it("should not allow bad alternative names", function (done) {
        session.participate("show-bieber", ["trolled"], function(err, alt) {
            assert.equal(alt, null);
            expect(err).instanceof(Error);

            session.participate("show-bieber", ["trolled", "%%"], function(err, alt) {
                assert.equal(alt, null);
                expect(err).instanceof(Error);
                done();
            });
        });
    });

    it("should work without using the simple methods", function (done) {
        session.convert("testing", function(err, res) {
            if (err) throw err;
            expect(res.status).equal("failed");

            session.participate("testing", ["one", "two"], function(err, res) {
                if (err) throw err;
                var alt1 = res.alternative.name;
                var old_id = session.client_id;
                session.client_id = ConstructorioAB.generate_client_id();

                session.convert("testing", function(err, res) {
                    if (err) throw err;
                    expect(res.status).equal("failed");

                    session.participate("testing", ["one", "two"], function(err, res) {
                        if (err) throw err;
                        session.client_id = old_id;

                        session.participate("testing", ["one", "two"], function(err, res) {
                            if (err) throw err;
                            expect(res.alternative.name).to.equal(alt1);
                            done();
                        });
                    });
                });
            });
        });
    });

    it("should return an error when experiment_name is incorrect", function (done) {
        session.client_id = "mike";
        session.participate(undefined, ["trolled", "not-trolled"], function(err, resp) {
            expect(err).to.be.an.instanceof(Error);
            expect(err.message).to.equal("Bad experiment_name");

            session.convert(undefined, function(err, resp) {
                expect(err).to.be.an.instanceof(Error);
                expect(err.message).to.equal("Bad experiment_name");
                done();
            });
        });
    });

    it("should throw an error when callback is undefined", function (done) {
        session.client_id = "mike";
        expect(function() {
            session.participate("show-bieber", ["trolled", "not-trolled"]);
        }).to.throw(
            Error, /^Callback is not specified$/
        );

        done();
    });

    it("should throw an error if less than 2 alternatives are passed in", function (done) {
        session.participate("testing", [], function(err, resp) {
            expect(err.message).to.match(/^Must specify at least 2 alternatives$/);
            done();
        });
    });

    it("should get the alternative name from a cookie when participate is called a second time", function (done) {
        session.participate("show-bieber", ["trolled", "not-trolled"], function(err, resp) {
            if (err) throw err;
            session._request = sinon.stub();
            session.participate("show-bieber", ["trolled", "not-trolled"], function(err, resp) {
                if (err) throw err;
                expect(resp.alternative.name).to.equal('trolled');
                expect(session._request.notCalled).to.be.true;
                done();
            });
        });
    });

});
