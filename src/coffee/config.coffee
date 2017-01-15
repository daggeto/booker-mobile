app.config (
  $ionicConfigProvider,
  $ionicCloudProvider,
  $translateProvider,
  $httpProvider,
  $authProvider,
  AjaxInterceptorProvider,
  API_URL,
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

  $httpProvider.interceptors.push 'AuthInterceptor'

  AjaxInterceptorProvider.config(
    defaultMessage: "Network error. Please check your connection.")

  $authProvider.configure
    apiUrl: API_URL
    tokenValidationPath: '/user/validate_token'
    emailSignInPath: '/user/sign_in'
    signOutUrl: '/user/sign_out'
    emailRegistrationPath: '/user'
    storage: 'localStorage'
