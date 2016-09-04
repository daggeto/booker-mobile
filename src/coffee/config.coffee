app.config ($ionicConfigProvider, $ionicCloudProvider) ->
  $ionicConfigProvider.tabs.position('bottom');

  $ionicConfigProvider.views.swipeBackEnabled(false);

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

app.factory('AuthInterceptor', ($rootScope, $q, AUTH_EVENTS, SERVER_EVENTS) ->
  { responseError: (response) ->
    $rootScope.$broadcast {
      401: AUTH_EVENTS.notAuthorized
      403: AUTH_EVENTS.notAuthenticated
      404: SERVER_EVENTS.not_found
    }[response.status], response

    $q.reject response
 }
)
app.config ($httpProvider) ->
  $httpProvider.interceptors.push 'AuthInterceptor'
  return
