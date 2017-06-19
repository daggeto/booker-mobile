app.run (PushNotificationService, StorageService, STORAGE_KEYS, $ionicPlatform) ->
  $ionicPlatform.ready ->
    PushNotificationService.registerToken().then (token) ->
      return unless token.registered

      PushNotificationService.saveToken()
      StorageService.set(STORAGE_KEYS.DEVICE_TOKEN, token.token)

  $ionicPlatform.on 'resume', ->
    StorageService.get(STORAGE_KEYS.DEVICE_TOKEN)
