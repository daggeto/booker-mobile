class NotificationService
  'use strict'

  constructor: (
    $rootScope,
    $ionicPush,
    $ionicEventEmitter,
    $cordovaLocalNotification,
    Navigator,
    DeviceService
  ) ->
    [
      @rootScope,
      @ionicPush,
      @ionicEventEmitter,
      @cordovaLocalNotification,
      @Navigator,
      @DeviceService
    ] = arguments

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
      console.log("Token registerd #{token}")
      @ionicPush.saveToken(token)

  saveToken: ->
    if @ionicPush.storage.get('ionic_io_push_token')
      @DeviceService.save(token: @ionicPush.token.token, platform: ionic.Platform.platform())

app.service('NotificationService', NotificationService)
