app.factory 'AuthService', (
  $rootScope,
  $q,
  $auth,
  $ionicHistory,
  $cordovaNativeStorage,
  NotificationService,
  Context,
  IntervalsService,
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

          d.resolve(user)
        .catch ->
          d.reject('Login failed')

      d.promise

    saveToken: =>
      NotificationService.saveToken()

    logout: ->
      @destroyCurrentUser()
      NotificationService.unregisterToken()
      $ionicHistory.clearCache()
      IntervalsService.stop(UPDATE_LOADED_SERVICES_INTERVAL)
      $cordovaNativeStorage.remove(AUTH_HEADER)

      $auth.signOut()
        .then => console.log('Loggout success')
        .catch -> console.log('Loggout failed')

    signup: (data) ->
      $auth.submitRegistration(data)

    destroyCurrentUser: ->
      Context.setCurrentUser(null)
