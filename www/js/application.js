var app;

app = angular.module('booker', ['ionic', 'ngCordova', 'ngResource', 'angularMoment', 'ion-datetime-picker', 'ionic-toast', 'ionic-ajax-interceptor', 'ionicLazyLoad', 'ng-token-auth', 'ngMessages', 'ionic.cloud']).config(function(AjaxInterceptorProvider, $authProvider, API_URL) {
  AjaxInterceptorProvider.config({
    title: "Ups",
    defaultMessage: "I crashed :("
  });
  return $authProvider.configure({
    apiUrl: API_URL,
    tokenValidationPath: '/user/validate_token',
    emailSignInPath: '/user/sign_in',
    signOutUrl: '/user/sign_out',
    emailRegistrationPath: '/user',
    storage: 'localStorage'
  });
}).run(function($rootScope, $state, $ionicPlatform, $ionicPopup, $locale, $log, $auth, Navigator, amMoment, AjaxInterceptor, NotificationService, AuthService, AUTH_EVENTS, SERVER_EVENTS) {
  $ionicPlatform.ready((function(_this) {
    return function() {
      NotificationService.registerToken();
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);
      }
      if (window.StatusBar) {
        return StatusBar.styleDefault();
      }
    };
  })(this));
  $rootScope.$on('$stateChangeStart', function(event, next, nextParams, fromState) {
    var ref;
    if (!AuthService.isAuthenticated) {
      if ((ref = next.name) !== 'login' && ref !== 'signup') {
        event.preventDefault();
        return $state.transitionTo('login');
      }
    }
  });
  $rootScope.$on(AUTH_EVENTS.notAuthorized, function(event) {
    var alertPopup;
    $state.go('login');
    $auth.deleteData('auth_headers');
    return alertPopup = $ionicPopup.alert({
      title: 'Unauthorized!',
      template: 'You are not allowed to access this resource.'
    });
  });
  $rootScope.$on(SERVER_EVENTS.not_found, function(event) {
    var alertPopup;
    return alertPopup = $ionicPopup.alert({
      title: 'Ups! Little problems.',
      template: 'Try to login again'
    });
  });
  $rootScope.error = function(message) {
    $ionicPopup.alert({
      template: 'Ups! Little problems.'
    });
    return $log.error(message);
  };
  $rootScope.navigator = Navigator;
  AjaxInterceptor.run();
});
