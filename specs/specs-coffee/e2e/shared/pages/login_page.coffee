class LoginPage
  constructor: ->
    @url = 'login'

    @message = element(By.css('.message__success'))

    @email = element(By.model('vm.data.email'))
    @password = element(By.model('vm.data.password'))
    @loginButton = element(By.id('login'))

  get: ->
    browser.get("/#/#{@url}")
    return @

  setEmail: (text) ->
    @email.sendKeys(text)
    return @

  setPassword: (text) ->
    @password.sendKeys(text)
    return @

  submit: ->
    @loginButton.click()

module.exports = LoginPage
