app.factory 'Navigator', ($state, $ionicHistory, $ionicViewService) ->
  new class Navigator
    go: (state, params) ->
      $state.go(state, params).catch (error) ->
        console.log(error)

    home: (params) ->
      $state.transitionTo('app.main', params)

    back: ->
      return $ionicHistory.goBack() if $ionicHistory.backView()

      @home()
