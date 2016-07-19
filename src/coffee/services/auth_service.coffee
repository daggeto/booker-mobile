class AuthService
  'use strict'

  constructor: ($q, $auth, DeviceService, NotificationService, LOCAL_CURRENT_USER_ID) ->
    [@q, @auth, @DeviceService, @NotificationService, @LOCAL_CURRENT_USER_ID] = arguments

    @isAuthenticated = @auth.retrieveData('auth_headers') != null

  login: (data) ->
    d = @q.defer()

    @auth.submitLogin(data)
      .then (user) =>
        @isAuthenticated = true

        @storeUserCredentials(user)
        @saveToken()

        d.resolve(user)
      .catch ->
        d.reject('Login failed')

    d.promise

  saveToken: =>
    token = @NotificationService.getToken()

    @DeviceService.save(token: token.token, platform: ionic.Platform.platform())

  logout: ->
    @isAuthenticated = true

    @destroyUserCredentials()

    @auth.signOut()
      .then => console.log('Loggout success')
      .catch -> console.log('Loggout failed')

  signup: (data) ->
    @auth.submitRegistration(data)

  storeUserCredentials: (user) ->
    window.localStorage.setItem(@LOCAL_CURRENT_USER_ID, user.id)

  destroyUserCredentials: ->
    window.localStorage.removeItem(@LOCAL_CURRENT_USER_ID)

app.service('AuthService', AuthService)
