Booker.describe 'ServiceBook', ->
  user_id = 1
  service_id = 1

  Booker.let('user', attributes: { id: user_id, email: 'wow@wow.com' })
  Booker.let('service', attributes: { id: service_id, published: true })
  Booker.let('event', attributes: { service_id: service_id })

  beforeEach ->
    protractor.helper.login('wow@wow.com', '123123123')

  it 'logs in to app', ->
    expect(browser.getLocationAbsUrl()).toMatch('/app/main')

    element(By.css('book-button button')).click()
