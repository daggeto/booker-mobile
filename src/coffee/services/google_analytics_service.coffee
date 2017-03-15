app.factory 'GoogleAnalyticsService',
  (
    $window,
    Context,
    LoggerService,
    GA_ID,
    APP_VERSION,
    ENVIRONMENT
  ) ->
      new class GoogleAnalyticsService
        init: ->
          return unless $window.ga

          $window.ga.debugMode() if ENVIRONMENT == 'development'

          $window.ga.startTrackerWithId(GA_ID, 1, @success, @error)
          $window.ga.setAppVersion(APP_VERSION, @success, @error)

          user = Context.getCurrentUser()

          $window.ga.setUserId(user.id, @success, @error) if user

        trackView: (name) ->
          $window.ga.trackView(name, null, false, @success, @error) if $window.ga

        trackEvent: (category, action, label, value) ->
          return unless $window.ga

          $window.ga.trackEvent(category, action, label, value, false, @success, @error)

        success: ->

        error: (error) ->
          LoggerService.angularException(
            message: 'Google Analytics does not registerd',
            error: error
          )
