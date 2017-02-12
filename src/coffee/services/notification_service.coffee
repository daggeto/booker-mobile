app.factory 'NotificationService', (
  $rootScope,
  $ionicPush,
  $cordovaLocalNotification,
  $q,
  Navigator,
  DeviceService,
  Notification,
  LoggerService,
  EVENTS,
  ERROR_TYPES
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

        @markAsRead(payload.notification_id).then => @fireCurrentUserUpdate()

        @navigateFromNotification(payload)

      onForeground: (message) ->
        @fireCurrentUserUpdate()

        $cordovaLocalNotification.schedule
          id: 1
          title: message.title,
          text: message.text,
          data: message.payload
          icon: 'ic_notification'
          color: '3ea6ee'
          sound: 'default'


      onBackground: (message) ->
        @markAsRead(message.payload.notification_id).then => @fireCurrentUserUpdate()

        @navigateFromNotification(message.payload)

      fireCurrentUserUpdate: ->
        $rootScope.$emit(EVENTS.UPDATE_CURRENT_USER)

      navigateFromNotification: (payload) ->
        Navigator.go(payload.state, payload.stateParams)

      registerToken: =>
        d = $q.defer()

        $ionicPush.register()
          .then (token) =>
            console.log("Token registered #{token}")
            $ionicPush.saveToken(token)
            d.resolve(token)
          .catch (error) ->
            LoggerService.captureException('Token does not registered',
              type: ERROR_TYPES.TOKEN,
              extraContext: error
            )



      unregisterToken: ->
        $ionicPush.unregister()

      saveToken: ->
        return @saveTokenToServer() if $ionicPush.storage.get('push_token')

        @registerToken().then =>
          @saveTokenToServer()

      saveTokenToServer: ->
        DeviceService
          .save(token: $ionicPush.token.token, platform: ionic.Platform.platform())
          .catch (error) ->
            LoggerService.captureException('Token does not saved',
              type: ERROR_TYPES.TOKEN,
              extraContext: error
          )

      findAll: ->
        Notification.$r.get().$promise

      markAsRead: (id) ->
        Notification.$r.post(notification_id: id, action: 'mark_as_read').$promise

      markAllAsRead: ->
        Notification.$r.post(action: 'mark_all_as_read').$promise
