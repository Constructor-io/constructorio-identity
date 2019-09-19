var expect = require('chai').expect;
var jsdom = require('jsdom');
var ConstructorioID = require('../src/constructorio-id.js');

describe('ConstructorioID', function () {
  beforeEach(function () {
    var dom = new jsdom.JSDOM(``, {
      url: 'http://localhost'
    });
    global.window = dom.window;
    global.document = dom.window.document;
  });

  afterEach(function () {
    delete global.window;
    delete global.document;
  });

  describe('set_cookie', function () {
    it('should create a cookie', function () {
      var session = new ConstructorioID();
      session.set_cookie('mewantcookie', 'meeatcookie');
      expect(global.document.cookie).to.match(/mewantcookie=meeatcookie/);
    });
  });

  describe('get_cookie', function () {
    it('should read an existing cookie', function () {
      document.cookie = 'melikecookie=omnomnom; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';
      var session = new ConstructorioID();
      var value = session.get_cookie('melikecookie');
      expect(value).to.match(/^omnomnom$/);
    });

    it('should not read a missing cookie', function () {
      var session = new ConstructorioID();
      var value = session.get_cookie('melikecookie');
      expect(value).to.be.undefined;
    });
  });

  describe('update_cookie', function () {
    it('should update a matching cookie', function () {
      document.cookie = 'dummyname=dummyid; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';
      document.cookie = 'ConstructorioAB_veggie=turnips; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';
      var session = new ConstructorioID({ cookie_name: 'dummyname' });
      session.update_cookie('ConstructorioID_veggie');
      expect(document.cookie).to.equal('dummyname=dummyid; ConstructorioID_veggie=turnips');
    });

    it('should skip a non matching cookie', function () {
      document.cookie = 'dummyname=dummyid; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';
      document.cookie = 'ConstructorioBC_veggie=turnips; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';
      var session = new ConstructorioID({ cookie_name: 'dummyname' });
      session.update_cookie('ConstructorioID_veggie');
      expect(document.cookie).to.equal('dummyname=dummyid; ConstructorioBC_veggie=turnips');
    });
  });

  describe('delete_cookie', function () {
    it('should remove a matching cookie', function () {
      document.cookie = 'dummyname=dummyid; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';
      document.cookie = 'deleteme=now; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';
      var session = new ConstructorioID({ cookie_name: 'dummyname' });
      session.delete_cookie('deleteme');
      expect(document.cookie).to.equal('dummyname=dummyid');
    });

    it('should skip a non-matching cookie', function () {
      document.cookie = 'dummyname=dummyid; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';
      document.cookie = 'skipme=now; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/';
      var session = new ConstructorioID({ cookie_name: 'dummyname' });
      session.delete_cookie('deleteme');
      expect(document.cookie).to.equal('dummyname=dummyid; skipme=now');
    });
  });

  describe('generate_client_id', function () {
    it('should return a client id and set the cookie', function () {
      var session = new ConstructorioID({ cookie_name: 'monster' });
      var client_id = session.generate_client_id();
      expect(session.get_cookie('monster')).to.equal(client_id);
      expect(client_id).to.be.a.string;
      expect(client_id).to.match(/(\w|d|-){36}/);
    });
  });
});
