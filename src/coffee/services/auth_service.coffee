app.factory 'AuthService', (
  $rootScope,
  $q,
  $auth,
  $ionicHistory,
  $cordovaNativeStorage,
  PushNotificationService,
  TokenService
  Context,
  CurrentUserResolver,
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
          Context.setCurrentUser(user)

          d.resolve(user)
        .catch (error) ->
          LoggerService.angularException('Submit Login failed.', extraContext: error)
          d.reject(error)

      d.promise

    saveToken: =>
      PushNotificationService.saveToken()

    logout: ->
      PushNotificationService.unregisterToken()
      $ionicHistory.clearCache()
      IntervalsService.stop(UPDATE_LOADED_SERVICES_INTERVAL)
      TokenService.remove()

      $auth.signOut()
        .then => CurrentUserResolver.updateCurrentUser()
        .catch -> console.log('Loggout failed')

    signup: (data) ->
      $auth.submitRegistration(data)

    destroyCurrentUser: ->
      Context.setCurrentUser(null)
