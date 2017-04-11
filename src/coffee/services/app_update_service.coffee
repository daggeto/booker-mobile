app.factory 'AppUpdateService',
  (
    $rootScope,
    $ionicDeploy,
    $ionicPopup,
    translateFilter,
    APP_CHANNEL
  ) ->
    new class AppUpdateService
      constructor: ->
        @storeUpdate = false

      checkForUpdate: ->
        @doDeploy().check().then (updateAvailable) =>
          return unless updateAvailable

          @checkForMetaData ->
            $rootScope.updateAvailable = updateAvailable

      checkForMetaData: (callback) ->
        $ionicDeploy.getMetadata().then (metadata) =>
          @storeUpdate = metadata.storeUpdate

          callback()

      download: ->
        return @notifyAboutStoreUpdate() if @storeUpdate

        $rootScope.updateInProgess = true
        
        @doDeploy().download().then(@extract)

      notifyAboutStoreUpdate: () ->
        template = translateFilter('app_update.store_update')

        storeName = @getStoreName()

        $ionicPopup.alert
          title: translateFilter('app_update.popup_title'),
          template: "#{template} #{storeName}"

      getStoreName: ->
        return translateFilter('app_update.google_play') if ionic.Platform.isAndroid()

        translateFilter('app_update.app_store')

      extract: =>
        @doDeploy().extract().then(@load)

      load: =>
        $rootScope.updateInProgess = false
        @doDeploy().load()

      doDeploy: ->
        $ionicDeploy.channel = APP_CHANNEL;

        $ionicDeploy
