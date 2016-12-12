exports.config = {
  directConnect: true,
  capabilities: {
    'browserName': 'chrome',
    'chromeOptions': {
      args: ['--disable-web-security']
    }
  },
  baseUrl: 'http://localhost:8100',
  specs: [
    'specs-js/e2e/specs/**/*.js'
  ],
  jasmineNodeOpts: {
    isVerbose: true,
  },
  onPrepare: function () {
    protractor.helper = require('./specs-js/e2e/shared/helper.js');
  }
};

Booker = require('./specs-js/shared/e2e_describe');
