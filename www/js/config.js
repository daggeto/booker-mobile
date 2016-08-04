app.config(function($ionicConfigProvider, $ionicCloudProvider) {
  $ionicConfigProvider.tabs.position('bottom');
  return $ionicCloudProvider.init({
    core: {
      app_id: '22e15946',
      gcm_key: '248592828963'
    },
    pluginConfig: {
      android: {
        icon: 'icon.png'
      }
    }
  });
});

app.factory('AuthInterceptor', function($rootScope, $q, AUTH_EVENTS, SERVER_EVENTS) {
  return {
    responseError: function(response) {
      $rootScope.$broadcast({
        401: AUTH_EVENTS.notAuthorized,
        403: AUTH_EVENTS.notAuthenticated,
        404: SERVER_EVENTS.not_found
      }[response.status], response);
      return $q.reject(response);
    }
  };
});

app.config(function($httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptor');
});
