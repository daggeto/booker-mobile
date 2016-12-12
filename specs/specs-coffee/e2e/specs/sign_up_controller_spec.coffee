SignUpPage = require('../shared/pages/sign_up_page')
LoginPage = require('../shared/pages/login_page')

describe 'SignUpController', ->
  beforeEach =>
    @loginPage = new LoginPage()
    @signUpPage = new SignUpPage()

  it 'creates new user', =>
    $email = 'test_1@gmail.com'
    $password = '123123123'

    @signUpPage
      .get()
      .setEmail($email)
      .setPassword($password)
      .setConfirmPassword($password)
      .acceptTerms()
      .signUp()
    expect(browser.getLocationAbsUrl()).toMatch(@loginPage.url)
    expect(@loginPage.message.isPresent()).toBeTruthy()
