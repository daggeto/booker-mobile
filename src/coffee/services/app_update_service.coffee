app.factory 'AppUpdateService', ($ionicDeploy, APP_CHANNEL) ->
  new class AppUpdateService
    checkForUpdate: ->
      @doDeploy().check()

    download: ->
      @doDeploy().download().then(@extract)

    extract: =>
      @doDeploy().extract().then(@load)

    load: =>
      @doDeploy().load()

    doDeploy: ->
      $ionicDeploy.channel = APP_CHANNEL;

      $ionicDeploy
