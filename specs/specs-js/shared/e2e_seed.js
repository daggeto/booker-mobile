var call, create, purge, request, seed, seedCallbacks, seeds;

request = require('request');

seedCallbacks = [];

exports.seedCallbacks = (function(_this) {
  return function() {
    return seedCallbacks;
  };
})(this);

seeds = {};

exports["let"] = (function(_this) {
  return function(name, params) {
    return seeds[name] = params;
  };
})(this);

exports.executeSeed = (function(_this) {
  return function(callback) {
    console.log('[Seeder] Registering callback');
    return seedCallbacks.push(callback);
  };
})(this);

exports.reset = (function(_this) {
  return function() {
    console.log('[Seeder] Reset seeds');
    seeds = {};
    return seedCallbacks = [];
  };
})(this);

call = function(url, method, params) {
  var defer, request_params;
  defer = protractor.promise.defer();
  console.log('[Seeder] Calling', url, method, params);
  request_params = {
    url: url,
    method: method,
    json: params
  };
  request(request_params, function(error, message) {
    console.log('[Seeder] Done call to', url);
    if (error || message.statusCode >= 400) {
      defer.reject({
        error: error,
        message: message
      });
    } else {
      defer.fulfill(message);
    }
  });
  return defer.promise;
};

exports.call = call;

purge = function() {
  return call('http://localhost:3000/api/seeds', 'DELETE');
};

exports.purge = purge;

create = function(params) {
  return call('http://localhost:3000/api/seeds', 'POST', params);
};

exports.create = create;

seed = function() {
  return create({
    factories: seeds
  });
};

exports.seed = seed;
