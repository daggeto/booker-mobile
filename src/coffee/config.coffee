app.config (
  $ionicConfigProvider,
  $ionicCloudProvider,
  $translateProvider,
  LOCALE,
  TRANSLATIONS
) ->
  $ionicConfigProvider.tabs.position('bottom')
  $ionicConfigProvider.views.swipeBackEnabled(false)

  if ionic.Platform.isIOS()
    $ionicConfigProvider.scrolling.jsScrolling(true)

  $ionicCloudProvider.init
    core:
      app_id: '22e15946'
      gcm_key: '248592828963'
    push:
      debug: true,
      sender_id: '248592828963'
      pluginConfig:
        android:
          icon: 'ic_notification'
          iconColor: '#3ea6ee'
        ios:
          badge: true,
          sound: true

  $translateProvider
    .translations(LOCALE, TRANSLATIONS)
    .preferredLanguage(LOCALE)

app.factory('AuthInterceptor', ($rootScope, $q, AUTH_EVENTS, SERVER_EVENTS) ->
  { responseError: (response) ->
    $rootScope.$broadcast {
      401: AUTH_EVENTS.notAuthorized
      403: AUTH_EVENTS.notAuthenticated
    }[response.status], response

    $q.reject response
 }
)
app.config ($httpProvider) ->
  $httpProvider.interceptors.push 'AuthInterceptor'
  return
