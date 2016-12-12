Booker.describe('ServiceBook', function() {
  var service_id, user_id;
  user_id = 1;
  service_id = 1;
  Booker["let"]('user', {
    attributes: {
      id: user_id,
      email: 'wow@wow.com'
    }
  });
  Booker["let"]('service', {
    attributes: {
      id: service_id,
      published: true
    }
  });
  Booker["let"]('event', {
    attributes: {
      service_id: service_id
    }
  });
  beforeEach(function() {
    return protractor.helper.login('wow@wow.com', '123123123');
  });
  return it('logs in to app', function() {
    expect(browser.getLocationAbsUrl()).toMatch('/app/main');
    return element(By.css('book-button button')).click();
  });
});
