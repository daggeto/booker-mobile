app.factory 'AuthWrapper',
  (
    $q,
    $state,
    LoggerService,
    TokenService,
    ERROR_TYPES
  ) ->
    new class AuthWrapper
      wrap: (requestCallback) ->
        token = TokenService.getTokenFromLocalStorage()

        return @preloadAuthHeader(requestCallback) unless token

        defer = $q.defer()

        @callRequest(defer, requestCallback)

        defer.promise

      preloadAuthHeader: (requestCallback) ->
        defer = $q.defer()

        TokenService.getToken()
          .then (header) => @forwardRequest(header, defer, requestCallback)
          .catch (error) ->
            LoggerService.sendMessage('Login in TokenService',
              level: 'warning',
              extraContext: { error: error }
            )

            $state.go('login')

        defer.promise

      forwardRequest: (header, defer, requestCallback) ->
        TokenService.setTokenToLocalStorage(header)

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
