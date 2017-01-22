app.factory 'AppUpdateService', ($rootScope, $ionicDeploy, APP_CHANNEL) ->
  new class AppUpdateService
    checkForUpdate: ->
      @doDeploy().check().then (updateAvailable) ->
        $rootScope.updateAvailable = updateAvailable

    download: ->
      @doDeploy().download().then(@extract)

    extract: =>
      @doDeploy().extract().then(@load)

    load: =>
      @doDeploy().load()

    doDeploy: ->
      $ionicDeploy.channel = APP_CHANNEL;

      $ionicDeploy
