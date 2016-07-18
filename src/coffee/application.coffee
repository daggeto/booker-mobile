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
    'ionicLazyLoad',
    'ng-token-auth',
    'ngMessages'
  ]
)
.config((AjaxInterceptorProvider, $authProvider, API_URL) ->
  AjaxInterceptorProvider.config(
    title: "Ups",
    defaultMessage: "I crashed :("
  )

  $authProvider.configure
    apiUrl: API_URL
    tokenValidationPath: '/user/validate_token'
    emailSignInPath: '/user/sign_in'
    signOutUrl: '/user/sign_out'
    emailRegistrationPath: '/user'
    storage: 'localStorage'
)
.run(($rootScope, $state, $ionicPlatform, $ionicPopup, $locale, $log, $auth,
      Navigator, amMoment, AjaxInterceptor, AuthService, AUTH_EVENTS, SERVER_EVENTS) ->
  $ionicPlatform.ready =>
    if window.cordova and window.cordova.plugins.Keyboard
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      cordova.plugins.Keyboard.disableScroll(true);

    if window.StatusBar
      StatusBar.styleDefault();

  $rootScope.$on('$stateChangeStart', (event, next, nextParams, fromState) ->
    if !AuthService.isAuthenticated
      unless next.name in ['login', 'signup']
        event.preventDefault()
        $state.transitionTo('login')
  )

  $rootScope.$on(AUTH_EVENTS.notAuthorized, (event) ->
    $state.go('login')
    $auth.deleteData('auth_headers')
    alertPopup = $ionicPopup.alert(
      title: 'Unauthorized!'
      template: 'You are not allowed to access this resource.')
	)

  $rootScope.$on(SERVER_EVENTS.not_found, (event) ->
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
