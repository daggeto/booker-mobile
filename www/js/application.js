var app;

app = angular.module('booker', ['ionic', 'ngCordova', 'ngResource', 'angularMoment', 'ion-datetime-picker', 'ionic-toast', 'ionic-ajax-interceptor', 'ionicLazyLoad']).config(function(AjaxInterceptorProvider) {
  return AjaxInterceptorProvider.config({
    title: "Ups",
    defaultMessage: "I crashed :("
  });
}).run(function($rootScope, $state, $ionicPlatform, $ionicPopup, $locale, $log, amMoment, AjaxInterceptor, AuthService, AUTH_EVENTS, SERVER_EVENTS) {
  $ionicPlatform.ready(function() {
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      return StatusBar.styleDefault();
    }
  });
  $rootScope.$on('$stateChangeStart', function(event, next, nextParams, fromState) {
    if (!AuthService.isAuthenticated()) {
      if (next.name !== 'login') {
        event.preventDefault();
        return $state.transitionTo('login');
      }
    }
  });
  $rootScope.$on(AUTH_EVENTS.notAuthorized, function(event) {
    var alertPopup;
    return alertPopup = $ionicPopup.alert({
      title: 'Unauthorized!',
      template: 'You are not allowed to access this resource.'
    });
  });
  $rootScope.$on(AUTH_EVENTS.notAuthenticated, function(event) {
    var alertPopup;
    AuthService.logout();
    $state.go('login');
    return alertPopup = $ionicPopup.alert({
      title: 'Session Lost!',
      template: 'Sorry, You have to login again.'
    });
  });
  $rootScope.$on(SERVER_EVENTS.not_found, function(event) {
    var alertPopup;
    AuthService.logout();
    $state.go('login');
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
  AjaxInterceptor.run();
});
