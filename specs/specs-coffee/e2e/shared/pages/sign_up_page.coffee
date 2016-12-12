class SignUpPage
  constructor: ->
    @email = element(By.model('vm.signup_data.email'))
    @password = element(By.model('vm.signup_data.password'))
    @confirm_password = element(By.model('vm.signup_data.password_confirmation'))
    @terms = element(By.model('vm.signup_data.terms'))

    @signUpButton = element(By.css('button[type=submit]'))

  get: ->
    browser.get('/#/signup')
    @

  setEmail: (text) ->
    @email.sendKeys(text)
    @

  setPassword: (text) ->
    @password.sendKeys(text)
    @

  setConfirmPassword: (text) ->
    @confirm_password.sendKeys(text)
    @

  acceptTerms: ->
    @terms.click()
    @

  signUp: ->
    @signUpButton.click()

module.exports = SignUpPage
