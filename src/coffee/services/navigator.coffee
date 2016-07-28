class Navigator
  'use strict'

  constructor: ($state, $ionicHistory) ->
    [@state, @ionicHistory] = arguments

  go: (state, params) ->
    @state.go(state, params).catch (error) ->
      console.log(error)

  home: (params) ->
    @state.go('app.main', params)

  back: ->
    return @ionicHistory.goBack() if @ionicHistory.backView()

    @home()

app.service('Navigator', Navigator)
