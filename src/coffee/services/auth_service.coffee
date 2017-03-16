app.factory 'AuthService', (
  $rootScope,
  $q,
  $auth,
  $ionicHistory,
  $cordovaNativeStorage,
  NotificationService,
  TokenService
  Context,
  IntervalsService,
  LoggerService,
  UPDATE_LOADED_SERVICES_INTERVAL
) ->
  new class AuthService
    AUTH_HEADER = 'auth_headers';

    isAuthenticated: ->
      $auth.retrieveData('auth_headers') != null

    login: (data) ->
      d = $q.defer()

      $auth.submitLogin(data)
        .then (user) =>
          @saveToken()

          TokenService.moveTokenFromLocalStorage()

          d.resolve(user)
        .catch(LoggerService.angularException)

      d.promise

    saveToken: =>
      NotificationService.saveToken()

    logout: ->
      @destroyCurrentUser()
      NotificationService.unregisterToken()
      $ionicHistory.clearCache()
      IntervalsService.stop(UPDATE_LOADED_SERVICES_INTERVAL)
      TokenService.remove()

      $auth.signOut()
        .then => console.log('Loggout success')
        .catch -> console.log('Loggout failed')

    signup: (data) ->
      $auth.submitRegistration(data)

    destroyCurrentUser: ->
      Context.setCurrentUser(null)
