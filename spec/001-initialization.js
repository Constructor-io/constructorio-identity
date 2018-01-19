var expect = require('chai').expect;
var jsdom = require('jsdom');
var ConstructorioAB = require('../src/constructorio-ab.js');

describe('ConstructorioAB.Session', function () {
  it('should have a defined interface', function () {
    var actualKeys = Object.keys(ConstructorioAB.Session.prototype);
    var expectedKeys = [
      'set_cookie',
      'get_cookie',
      'generate_client_id',
      'persisted_client_id',
      'participate',
      'convert',
      '_request',
      '_request_uri',
      '_in_array'
    ];
    expect(actualKeys).to.eql(expectedKeys);
  });

  it('should provide defaults', function () {
    var session = new ConstructorioAB.Session();
    expect(session.base_url).to.equal('https://ab.cnstrc.com');
    expect(session.ip_address).to.be.null;
    expect(session.user_agent).to.be.null;
    expect(session.timeout).to.equal(2000);
    expect(session.persist).to.be.true;
    expect(session.cookie_name).to.equal('ConstructorioAB_client_id');
    expect(session.cookie_prefix_for_experiment).to.equal('ConstructorioAB_experiment_');
    expect(session.cookie_domain).to.be.null;
  });

  it('should override defaults with options', function () {
    var session = new ConstructorioAB.Session({
      base_url: 'dummyurl',
      ip_address: 'dummyip',
      user_agent: 'dummyagent',
      timeout: 1,
      persist: false,
      cookie_name: 'dummyname',
      cookie_prefix_for_experiment: 'dummyprefix',
      cookie_domain: 'dummydomain'
    });
    expect(session.base_url).to.equal('dummyurl');
    expect(session.ip_address).to.equal('dummyip');
    expect(session.user_agent).to.equal('dummyagent');
    expect(session.timeout).to.equal(1);
    expect(session.persist).to.be.false;
    expect(session.cookie_name).to.equal('dummyname');
    expect(session.cookie_prefix_for_experiment).to.equal('dummyprefix');
    expect(session.cookie_domain).to.equal('dummydomain');
  });

  describe('when used in browser', function () {
    before(function () {
      var dom = new jsdom.JSDOM();
      global.window = dom.window;
      global.document = dom.window.document;
    });

    after(function () {
      delete global.window;
      delete global.document;
    });

    it('should read and set the client id from cookie', function () {

    });

    it('should read and set the user agent', function () {

    });
  });

  describe('when used in node', function () {
    it('should generate the client id if missing', function() {

    });

    it('should use the client id if in options', function() {

    });
  });
});
