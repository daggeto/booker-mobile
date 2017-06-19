app.factory('AuthInterceptor',
  (
    $rootScope,
    $q,
    $injector,
    StorageService,
    STORAGE_KEYS,
    API_URL,
    AUTH_EVENTS
  ) -> {
    request: (request) ->
      return request unless request.url.match(API_URL)

      request.headers[STORAGE_KEYS.DEVICE_TOKEN] =
        StorageService.getFromLocalStorage(STORAGE_KEYS.DEVICE_TOKEN)

      request

    responseError: (response) ->
      LoggerService = $injector.get('LoggerService')

      httpResponses = { 401: AUTH_EVENTS.notAuthorized }

      $rootScope.$broadcast(httpResponses[response.status], response)

      LoggerService.httpException(response)

      $q.reject response
  }
)
