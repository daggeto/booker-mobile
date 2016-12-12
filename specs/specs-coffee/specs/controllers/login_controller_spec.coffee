Booker.describe 'LoginController', ->
  beforeEach(inject((_$controller_, _$q_, _$rootScope_) =>
    @rootScope = _$rootScope_

    @deferredLogin = _$q_.defer();

    @nav = jasmine.createSpyObj('navigator spy', ['home'])
    scopeMock =
      navigator: @nav

    @stateParams = jasmine.createSpyObj('$stateParams spy', ['go'])

    @authService =
      login: jasmine.createSpy('login').and.returnValue(@deferredLogin.promise)

    @controller = _$controller_('LoginController',
      '$scope': scopeMock,
      '$stateParams': @stateParams,
      'AuthService': @authService
    );
  ))

  describe '#login', =>
    beforeEach =>
      @data = { email: 'email@email.com', password: 'password' }
      @controller.data = @data
      @controller.login()

    it 'navigates to home after login without message', =>
      expect(@authService.login).toHaveBeenCalledWith(@data)

      @deferredLogin.resolve()
      @rootScope.$digest()

      expect(@nav.home).toHaveBeenCalledWith(message: '')
