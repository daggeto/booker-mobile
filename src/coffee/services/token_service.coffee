app.factory 'TokenService', ($q, $window, $cordovaNativeStorage, LoggerService, ERROR_TYPES) ->
  new class TokenService
    AUTH_HEADER = 'auth_headers';

    NATIVE_STORAGE_ERRORS =
      1: 'NATIVE_WRITE_FAILED'
      2: 'ITEM_NOT_FOUND'
      3: 'NULL_REFERENCE'
      4: 'UNDEFINED_TYPE'
      5: 'JSON_ERROR'
      6: 'WRONG_PARAMETER'

    getTokenFromLocalStorage: ->
      $window.localStorage.getItem(AUTH_HEADER)

    setTokenToLocalStorage: (header) ->
      $window.localStorage.setItem(AUTH_HEADER, header)

    getToken: (success, error)->
      defer = $q.defer()

      return @getFromNativeStorage() unless typeof NativeStorage == 'undefined'

      defer.reject('NativeStorage not loaded yet')

      defer.promise

    moveTokenFromLocalStorage: ->
      token = @getTokenFromLocalStorage()

      @logNoHeaderException() unless token

      return if typeof NativeStorage == 'undefined'

      $cordovaNativeStorage.setItem(AUTH_HEADER, token).catch(@catchError)

    remove: ->
      $cordovaNativeStorage.remove(AUTH_HEADER)

    getFromNativeStorage: ->
      promise = $cordovaNativeStorage.getItem(AUTH_HEADER)

      promise.catch(@catchError)

      promise

    logNoHeaderException: ->
       LoggerService.captureException(
         'Token does not exist in local storage after response',
         level: 'error'
         type: ERROR_TYPES.TOKEN
       )

     catchError: (error) ->
       error.message = NATIVE_STORAGE_ERRORS[error.code]

       LoggerService.captureException(
         error,
         level: 'error'
         type: ERROR_TYPES.TOKEN
       )
