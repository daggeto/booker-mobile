app.factory 'NotificationService', (
  $rootScope,
  $ionicPush,
  $cordovaLocalNotification,
  $q,
  Navigator,
  DeviceService
) ->
    new class NotificationService
      constructor: ->
        $ionicPush.emitter.on('push:notification', @onNotification)
        $rootScope.$on('$cordovaLocalNotification:click', @onLocalNotificationClick)

      onNotification: (notification) =>
        return @onForeground(notification.message) if notification.raw.additionalData.foreground

        @onBackground(notification.message)

      onLocalNotificationClick: (event, notification, state) =>
        payload = JSON.parse(notification.data)

        @navigateFromNotification(payload)

      onForeground: (message) ->
        $cordovaLocalNotification.schedule
          id: 1
          title: message.title,
          text: message.text,
          data: message.payload
          icon: 'ic_notification'
          color: '3ea6ee'
          sound: 'default'


      onBackground: (message) ->
        @navigateFromNotification(message.payload)

      navigateFromNotification: (payload) ->
        Navigator.go(payload.state, payload.stateParams)

      registerToken: =>
        d = $q.defer()

        $ionicPush.register().then (token) =>
          console.log("Token registered #{token}")
          $ionicPush.saveToken(token)
          d.resolve(token)

      unregisterToken: ->
        $ionicPush.unregister()

      saveToken: ->
        return @saveTokenToServer() if $ionicPush.storage.get('push_token')

        @registerToken().then =>
          @saveTokenToServer()

      saveTokenToServer: ->
        DeviceService.save(token: $ionicPush.token.token, platform: ionic.Platform.platform())
