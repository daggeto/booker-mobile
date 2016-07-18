class AuthService
  'use strict'

  constructor: ($q, $auth, DeviceService, NotificationService, LOCAL_CURRENT_USER_ID) ->
    [@q, @auth, @DeviceService, @NotificationService, @LOCAL_CURRENT_USER_ID] = arguments

    @push = @NotificationService.push

    @isAuthenticated = @auth.retrieveData('auth_headers') != null


  login: (data) ->
    d = @q.defer()

    @auth.submitLogin(data)
      .then (user) =>
        @isAuthenticated = true

        @storeUserCredentials(user)

        @registerToken(user).then(@saveToken)

        d.resolve(user)
      .catch ->
        d.reject('Login failed')

    d.promise

  saveToken: (token) =>
    @push.saveToken(token,'ignore_user': true)
    @DeviceService.save(token: token.token, platform: ionic.Platform.platform())

  logout: ->
    @isAuthenticated = true

    @destroyUserCredentials()

    @auth.signOut()
      .then => console.log('Loggout success')
      .catch -> console.log('Loggout failed')

    @push.unregister().catch (error) ->
      console.log(error)

  signup: (data) ->
    @auth.submitRegistration(data)

  storeUserCredentials: (user) ->
    window.localStorage.setItem(@LOCAL_CURRENT_USER_ID, user.id)

  destroyUserCredentials: ->
    window.localStorage.removeItem(@LOCAL_CURRENT_USER_ID)

  getToken: ->
    @push.getStorageToken().token

  registerToken: ->
    d = @q.defer()

    @push.register (token) =>
      d.resolve(token)

    d.promise

app.service('AuthService', AuthService)
