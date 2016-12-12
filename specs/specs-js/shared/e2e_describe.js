var Seeder;

Seeder = require('./e2e_seed');

exports.executeSeed = (function(_this) {
  return function(callback) {
    return Seeder.executeSeed(callback);
  };
})(this);

exports["let"] = function(name, params) {
  return Seeder["let"](name, params);
};

exports.describe = function() {
  var exampleName, innerBlock;
  Seeder.reset();
  exampleName = arguments[0];
  innerBlock = arguments[1];
  return describe(exampleName, (function(_this) {
    return function() {
      beforeEach(function() {
        var flow, i, len, ref, results, seedCallback;
        flow = protractor.promise.controlFlow();
        flow.execute(Seeder.purge);
        flow.execute(Seeder.seed);
        ref = Seeder.seedCallbacks();
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          seedCallback = ref[i];
          results.push(flow.execute(seedCallback));
        }
        return results;
      });
      return innerBlock();
    };
  })(this));
};
