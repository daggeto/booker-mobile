Booker.describe('LoginController', function() {
  Booker["let"]('user', {
    attributes: {
      email: 'wow@wow.com'
    }
  });
  beforeEach(function() {
    return protractor.helper.login('wow@wow.com', '123123123');
  });
  return it('logs in to app', function() {
    return expect(browser.getLocationAbsUrl()).toMatch('/app/main');
  });
});
