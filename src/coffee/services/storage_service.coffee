app.factory 'StorageService', (
  $q,
  $window,
  $cordovaNativeStorage,
  LoggerService,
  ERROR_TYPES
) ->
  new class StorageService
    NATIVE_STORAGE_ERRORS =
      1: 'NATIVE_WRITE_FAILED'
      2: 'ITEM_NOT_FOUND'
      3: 'NULL_REFERENCE'
      4: 'UNDEFINED_TYPE'
      5: 'JSON_ERROR'
      6: 'WRONG_PARAMETER'

    constructor: () ->
      @defer = $q.defer()

    get: (key) ->
      localValue = @getFromLocalStorage(key)

      return @resolve(localValue) if localValue

      return @reject(@defer, 'NativeStorage not loaded yet') if typeof NativeStorage == 'undefined'

      promise = $cordovaNativeStorage.getItem(key)

      promise.then (value) =>
        console.log("Get From Native Storage: #{key} -> #{value}")

        @setToLocalStorage(key, value)

      promise.catch(@catchError)

      promise

    set: (key, value) ->
      @setToLocalStorage(key, value)

      return @reject(@defer, 'NativeStorage not loaded yet') if typeof NativeStorage == 'undefined'

      promise = $cordovaNativeStorage.setItem(key, value)

      promise.then (response) ->
        console.log("Set To Native Storage: #{response}")

      promise.catch(@catchError)

      promise

    getFromLocalStorage: (key) ->
      $window.localStorage.getItem(key)

    setToLocalStorage: (key, value) ->
      $window.localStorage.setItem(key, value)

    resolve: (value) ->
      @defer.resolve(value)

      @defer.promise

    reject: (message) ->
      @defer.reject(message)

      @defer.promise

    catchError: (error) ->
      error.message = NATIVE_STORAGE_ERRORS[error.code]

      LoggerService.captureException(
        error,
        level: 'error'
        type: ERROR_TYPES.NATIVE_STORAGE
      )
