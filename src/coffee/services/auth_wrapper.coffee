app.factory 'AuthWrapper',
  (
    $q,
    $window,
    $state,
    LoggerService,
    TokenService,
    ERROR_TYPES
  ) ->
    new class AuthWrapper
      wrap: (requestCallback) ->
        token = $window.localStorage.getItem(TokenService.AUTH_HEADER)

        return @preloadAuthHeader(requestCallback) unless token

        defer = $q.defer()

        @callRequest(defer, requestCallback)

        defer.promise

      preloadAuthHeader: (requestCallback) ->
        defer = $q.defer()

        TokenService.getToken()
          .then (header) => @forwardRequest(header, defer, requestCallback)
          .catch (error) => $state.go('login')

        defer.promise

      forwardRequest: (header, defer, requestCallback) ->
        $window.localStorage.setItem(TokenService.AUTH_HEADER, header)

        @callRequest(defer, requestCallback)

      callRequest: (defer, requestCallback) ->
        requestCallback.call()
          .then (response) => @resolveRequest(response, defer)
          .catch (error) => @rejectRequest(error, defer)

      resolveRequest: (response, defer) =>
        TokenService.moveTokenFromLocalStorage()

        defer.resolve(response)

      rejectRequest: (error, defer) ->
        defer.reject(error)
