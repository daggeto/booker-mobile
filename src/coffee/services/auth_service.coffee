app.factory 'AuthService', (
  $rootScope,
  $q,
  $auth,
  $ionicHistory,
  NotificationService,
  Context
) ->
  new class AuthService
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

      $auth.signOut()
        .then => console.log('Loggout success')
        .catch -> console.log('Loggout failed')

    signup: (data) ->
      $auth.submitRegistration(data)

    destroyCurrentUser: ->
      Context.setCurrentUser(null)
