Booker.describe('LoginController', function() {
  beforeEach(inject((function(_this) {
    return function(_$controller_, _$q_, _$rootScope_) {
      var scopeMock;
      _this.rootScope = _$rootScope_;
      _this.deferredLogin = _$q_.defer();
      _this.nav = jasmine.createSpyObj('navigator spy', ['home']);
      scopeMock = {
        navigator: _this.nav
      };
      _this.stateParams = jasmine.createSpyObj('$stateParams spy', ['go']);
      _this.authService = {
        login: jasmine.createSpy('login').and.returnValue(_this.deferredLogin.promise)
      };
      return _this.controller = _$controller_('LoginController', {
        '$scope': scopeMock,
        '$stateParams': _this.stateParams,
        'AuthService': _this.authService
      });
    };
  })(this)));
  return describe('#login', (function(_this) {
    return function() {
      beforeEach(function() {
        _this.data = {
          email: 'email@email.com',
          password: 'password'
        };
        _this.controller.data = _this.data;
        return _this.controller.login();
      });
      return it('navigates to home after login without message', function() {
        expect(_this.authService.login).toHaveBeenCalledWith(_this.data);
        _this.deferredLogin.resolve();
        _this.rootScope.$digest();
        return expect(_this.nav.home).toHaveBeenCalledWith({
          message: ''
        });
      });
    };
  })(this));
});
