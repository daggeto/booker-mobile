class NotificationService
  'use strict'

  constructor: ($rootScope, $ionicPush, $ionicEventEmitter, $cordovaLocalNotification,  Navigator) ->
    [@rootScope, @ionicPush, @ionicEventEmitter, @cordovaLocalNotification, @Navigator] = arguments

    @ionicEventEmitter.on('push:notification', @onNotification)
    @rootScope.$on('$cordovaLocalNotification:click', @onLocalNotificationClick)

  onNotification: (notification) =>
    return @onForeground(notification.message) if notification.raw.additionalData.foreground

    @onBackground(notification.message)

  onLocalNotificationClick: (event, notification, state) =>
    payload = JSON.parse(notification.data)

    @navigateFromNotification(payload)

  onForeground: (message) ->
    @cordovaLocalNotification.schedule
      id: 1
      title: message.title,
      text: message.text,
      data: message.payload


  onBackground: (message) ->
    @navigateFromNotification(message.payload)

  navigateFromNotification: (payload) ->
    @Navigator.go(payload.state, payload.stateParams)

  registerToken: =>
    @ionicPush.register().then (token) =>
      @ionicPush.saveToken(token)

  getToken: ->
    @ionicPush.token

app.service('NotificationService', NotificationService)
