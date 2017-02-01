app.factory('AuthInterceptor', ($rootScope, $q, $injector, AUTH_EVENTS, SERVER_EVENTS) ->
  { responseError: (response) ->

    LoggerService = $injector.get('LoggerService')

    $rootScope.$broadcast { 401: AUTH_EVENTS.notAuthorized }[response.status], response

    LoggerService.httpException(response)

    $q.reject response
 }
)
