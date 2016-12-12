LoginPage = require('./pages/login_page')

exports.login = (email, password) ->
  loginPage = new LoginPage()

  loginPage.get().setEmail(email).setPassword(password).submit()
