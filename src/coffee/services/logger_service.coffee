app.factory 'LoggerService', ($raven, $log, Context, APP_VERSION) ->
  new class LoggerService
    init: ->

    angularException: (exception) ->
      @captureException(exception, type: 'Angular')
      $log.error(exception)

    httpException: (response) ->
      message = "#{response.config.url} : #{response.status}"

      @captureException(new Error(message) , extraContext: response, type: 'Http')

    captureException: (exception, params)->
      $raven.setUserContext(@userInfo())
      $raven.setTagsContext(type: params.type)
      $raven.setExtraContext(params.extraContext)

      $raven.captureException(exception)

    sendMessage: (message, params = {}) ->
      $raven.setUserContext(@userInfo())
      $raven.setExtraContext(params.extraContext)

      $raven.captureMessage(message, level: params.level)

    userInfo: ->
      user = Context.getCurrentUser()

      return unless user

      { email: user.email, id: user.id }
