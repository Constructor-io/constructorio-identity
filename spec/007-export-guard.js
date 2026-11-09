const expect = require('chai').expect;
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, '../src/constructorio-id.js'), 'utf8');

describe('ConstructorioID', function () {
  describe('export guard', function () {
    it('should export through module.exports when a bundler provides module but no require', function () {
      const sandbox = { module: { exports: {} } };
      vm.runInNewContext(source, sandbox);
      expect(sandbox.module.exports).to.be.a('function');
    });

    it('should not throw when there is no module at all', function () {
      expect(function () {
        vm.runInNewContext(source, {});
      }).to.not.throw();
    });
  });
});
