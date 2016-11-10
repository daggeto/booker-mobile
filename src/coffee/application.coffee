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
    'ngMessages',
    'ionic.cloud',
    'ngAnimate',
    'pascalprecht.translate',
    @@templates
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
.run (
  $rootScope,
  $state,
  $ionicPlatform,
  $ionicPopup,
  $log,
  $auth,
  $translate,
  Navigator,
  AjaxInterceptor,
  NotificationService,
  AuthService,
  AUTH_EVENTS,
  SERVER_EVENTS
) ->
  $ionicPlatform.ready =>
    NotificationService.registerToken()

    if ionic.Platform.isIOS()
      cordova.plugins.notification.local.registerPermission (granted) ->
        console.log("Notifications granted: #{granted}")
    if window.cordova and window.cordova.plugins.Keyboard
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);

      cordova.plugins.Keyboard.disableScroll(true);

    if window.StatusBar
      StatusBar.styleDefault();

    setTimeout(
      -> navigator.splashscreen.hide()
    , 300)

  $rootScope.$on('$stateChangeStart', (event, next, nextParams, fromState) ->
    if !AuthService.isAuthenticated
      unless next.name in ['login', 'signup', 'terms']
        event.preventDefault()
        $state.transitionTo('login')
  )

  $rootScope.$on(AUTH_EVENTS.notAuthorized, ->
    $state.go('login')
    $auth.deleteData('auth_headers')

    $ionicPopup.alert
      template: $translate('errors.unauthorized'))

  $rootScope.$on SERVER_EVENTS.not_found, ->
    $ionicPopup.alert
      title: $translate('errors.something_wrong')
      template: $translate('errors.try_login_again')

  $rootScope.error = (message) ->
    $ionicPopup.alert(template: $translate('errors.something_wrong'))
    $log.error(message)

  $rootScope.navigator = Navigator

  $rootScope.stateIs = (state) ->
    $state.is(state)

  $rootScope.isAndroid = ->
    ionic.Platform.isAndroid()

  AjaxInterceptor.run()

  return
