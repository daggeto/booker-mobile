class NotificationService
  'use strict'

  constructor: ($ionicPopup, $ionicPush, $ionicEventEmitter, Navigator) ->
    [@ionicPopup, @ionicPush, @ionicEventEmitter, @Navigator] = arguments

  registerToken: =>
    @ionicPush.register().then (token) =>
      @ionicPush.saveToken(token)

    @ionicEventEmitter.on('push:notification', @onNotification)

  onNotification: (notification) =>
    return @onForeground(notification.message) if notification.raw.additionalData.foreground

    @onBackground(notification.message)


  onForeground: (message) ->

  onBackground: (message) ->
    state = message.payload.state
    stateParams = message.payload.stateParams

    @Navigator.go(state, stateParams)

  getToken: ->
    @ionicPush.token

app.service('NotificationService', NotificationService)
