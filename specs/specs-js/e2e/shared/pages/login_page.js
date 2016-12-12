var LoginPage;

LoginPage = (function() {
  function LoginPage() {
    this.url = 'login';
    this.message = element(By.css('.message__success'));
    this.email = element(By.model('vm.data.email'));
    this.password = element(By.model('vm.data.password'));
    this.loginButton = element(By.id('login'));
  }

  LoginPage.prototype.get = function() {
    browser.get("/#/" + this.url);
    return this;
  };

  LoginPage.prototype.setEmail = function(text) {
    this.email.sendKeys(text);
    return this;
  };

  LoginPage.prototype.setPassword = function(text) {
    this.password.sendKeys(text);
    return this;
  };

  LoginPage.prototype.submit = function() {
    return this.loginButton.click();
  };

  return LoginPage;

})();

module.exports = LoginPage;
