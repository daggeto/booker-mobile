app = angular.module(
  'booker',
  [
    'ionic',
    'ngCordova',
    'ngResource',
    'angularMoment',
    'ion-datetime-picker',
    'ionic-toast',
    'ionic-ajax-interceptor',
    'ionicLazyLoad'
  ]
)
.config((AjaxInterceptorProvider) ->
  AjaxInterceptorProvider.config(
    title: "Ups",
    defaultMessage: "I crashed :("
  )
)
.run(($rootScope, $state, $ionicPlatform, $ionicPopup, $locale, $log,
      Navigator, amMoment, AjaxInterceptor, AuthService, AUTH_EVENTS, SERVER_EVENTS) ->
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
        $state.transitionTo('login')
  )

  $rootScope.$on(AUTH_EVENTS.notAuthorized, (event) ->
    alertPopup = $ionicPopup.alert(
      title: 'Unauthorized!'
      template: 'You are not allowed to access this resource.')
	)

  $rootScope.$on(AUTH_EVENTS.notAuthenticated, (event) ->
    AuthService.logout()
    $state.go('login')
    alertPopup = $ionicPopup.alert(
      title: 'Session Lost!'
      template: 'Sorry, You have to login again.')
	)

  $rootScope.$on(SERVER_EVENTS.not_found, (event) ->
    AuthService.logout()
    $state.go('login')
    alertPopup = $ionicPopup.alert(
      title: 'Ups! Little problems.'
      template: 'Try to login again')
	)

  $rootScope.error = (message) ->
    $ionicPopup.alert(template: 'Ups! Little problems.')
    $log.error(message)

  $rootScope.navigator = Navigator

  AjaxInterceptor.run()

  return
)
