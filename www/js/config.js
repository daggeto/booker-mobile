app.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
  return $ionicConfigProvider.tabs.position('bottom');
});

app.factory('AuthInterceptor', function($rootScope, $q, AUTH_EVENTS, SERVER_EVENTS) {
  return {
    responseError: function(response) {
      $rootScope.$broadcast({
        401: AUTH_EVENTS.notAuthenticated,
        403: AUTH_EVENTS.notAuthorized,
        404: SERVER_EVENTS.not_found
      }[response.status], response);
      return $q.reject(response);
    }
  };
});

app.config(function($httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptor');
});
