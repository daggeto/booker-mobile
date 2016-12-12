var LoginPage;

LoginPage = require('./pages/login_page');

exports.login = function(email, password) {
  var loginPage;
  loginPage = new LoginPage();
  return loginPage.get().setEmail(email).setPassword(password).submit();
};
