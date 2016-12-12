var LoginPage, SignUpPage;

SignUpPage = require('../shared/pages/sign_up_page');

LoginPage = require('../shared/pages/login_page');

describe('SignUpController', function() {
  beforeEach((function(_this) {
    return function() {
      _this.loginPage = new LoginPage();
      return _this.signUpPage = new SignUpPage();
    };
  })(this));
  return it('creates new user', (function(_this) {
    return function() {
      var $email, $password;
      $email = 'test_1@gmail.com';
      $password = '123123123';
      _this.signUpPage.get().setEmail($email).setPassword($password).setConfirmPassword($password).acceptTerms().signUp();
      expect(browser.getLocationAbsUrl()).toMatch(_this.loginPage.url);
      return expect(_this.loginPage.message.isPresent()).toBeTruthy();
    };
  })(this));
});
