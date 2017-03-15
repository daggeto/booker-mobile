app.factory 'AuthWrapper',
  (
    $q,
    $cordovaNativeStorage,
    $window,
    $state,
    LoggerService,
    ERROR_TYPES
  ) ->
    new class AuthWrapper
      AUTH_HEADER = 'auth_headers';

      NATIVE_STORAGE_ERRORS =
        1: 'NATIVE_WRITE_FAILED'
        2: 'ITEM_NOT_FOUND'
        3: 'NULL_REFERENCE'
        4: 'UNDEFINED_TYPE'
        5: 'JSON_ERROR'
        6: 'WRONG_PARAMETER'

      wrap: (requestCallback) ->
        return @preloadAuthHeader(requestCallback) unless $window.localStorage.getItem(AUTH_HEADER)

        defer = $q.defer()

        @callRequest(defer, requestCallback)

        defer.promise

      preloadAuthHeader: (requestCallback) ->
        defer = $q.defer()

        $cordovaNativeStorage
          .getItem(AUTH_HEADER)
          .then (header) => @forwardRequest(header, defer, requestCallback)
          .catch (error) =>
            @catchError(error)

            $state.go('login')

        defer.promise

      forwardRequest: (header, defer, requestCallback) ->
        $window.localStorage.setItem(AUTH_HEADER, header)

        @callRequest(defer, requestCallback)

      callRequest: (defer, requestCallback) ->
        requestCallback.call()
          .then (response) => @resolveRequest(response, defer)
          .catch (error) => @rejectRequest(error, defer)

      resolveRequest: (response, defer) ->
        token = $window.localStorage.getItem(AUTH_HEADER)

        @logNoHeaderException() unless token

        $cordovaNativeStorage.setItem(AUTH_HEADER, token)
          .catch (error) -> @catchError(error)

        defer.resolve(response)

      rejectRequest: (error, defer) ->
        defer.reject(error)

      catchError: (error) ->
        error.message = NATIVE_STORAGE_ERRORS[error.code]

        LoggerService.captureException(
          error,
          level: 'error'
          type: ERROR_TYPES.TOKEN
        )

      logNoHeaderException: ->
         LoggerService.captureException(
           'Token does not exist in local storage after response',
           level: 'error'
           type: ERROR_TYPES.TOKEN
         )
