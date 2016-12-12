Booker.describe 'LoginController', ->
  Booker.let('user', attributes: { email: 'wow@wow.com' })

  beforeEach ->
    protractor.helper.login('wow@wow.com', '123123123')

  it 'logs in to app', ->
    expect(browser.getLocationAbsUrl()).toMatch('/app/main')
