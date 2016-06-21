app.config ($stateProvider, $urlRouterProvider, $ionicConfigProvider) ->
  $ionicConfigProvider.tabs.position('bottom');

app.factory('AuthInterceptor', ($rootScope, $q, AUTH_EVENTS, SERVER_EVENTS) ->
  { responseError: (response) ->
    $rootScope.$broadcast {
      401: AUTH_EVENTS.notAuthenticated
      403: AUTH_EVENTS.notAuthorized
      404: SERVER_EVENTS.not_found
    }[response.status], response
    $q.reject response
 }
)
app.config ($httpProvider) ->
  $httpProvider.interceptors.push 'AuthInterceptor'
  return
