app = angular.module(
  'booker',
  [
    'ionic',
    'ngResource',
    'angularMoment',
    'ion-datetime-picker',
    'ionic-toast',
    'ionic-ajax-interceptor'
  ]
)
.config((AjaxInterceptorProvider) ->
  AjaxInterceptorProvider.config(
    title: "Ups",
    defaultMessage: "I crashed :("
  )
)
.run(($rootScope, $state, AuthService, AUTH_EVENTS, $ionicPlatform,
      $locale, amMoment, AjaxInterceptor) ->
  $ionicPlatform.ready ->
    if window.cordova and window.cordova.plugins.Keyboard
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      cordova.plugins.Keyboard.disableScroll(true);
    if window.StatusBar
      StatusBar.styleDefault();

  $rootScope.$on('$stateChangeStart', (event, next, nextParams, fromState) ->
    if !AuthService.isAuthenticated()
      if next.name != 'login'
        event.preventDefault()
        $state.go('login')
  )

  AjaxInterceptor.run()

  return
)
