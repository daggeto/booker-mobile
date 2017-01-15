app.factory '$exceptionHandler', ($injector) ->
  (exception) =>
    LoggerService = $injector.get('LoggerService');

    LoggerService.angularException(exception)
    
