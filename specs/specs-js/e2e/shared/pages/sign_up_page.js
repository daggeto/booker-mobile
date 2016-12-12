var SignUpPage;

SignUpPage = (function() {
  function SignUpPage() {
    this.email = element(By.model('vm.signup_data.email'));
    this.password = element(By.model('vm.signup_data.password'));
    this.confirm_password = element(By.model('vm.signup_data.password_confirmation'));
    this.terms = element(By.model('vm.signup_data.terms'));
    this.signUpButton = element(By.css('button[type=submit]'));
  }

  SignUpPage.prototype.get = function() {
    browser.get('/#/signup');
    return this;
  };

  SignUpPage.prototype.setEmail = function(text) {
    this.email.sendKeys(text);
    return this;
  };

  SignUpPage.prototype.setPassword = function(text) {
    this.password.sendKeys(text);
    return this;
  };

  SignUpPage.prototype.setConfirmPassword = function(text) {
    this.confirm_password.sendKeys(text);
    return this;
  };

  SignUpPage.prototype.acceptTerms = function() {
    this.terms.click();
    return this;
  };

  SignUpPage.prototype.signUp = function() {
    return this.signUpButton.click();
  };

  return SignUpPage;

})();

module.exports = SignUpPage;
