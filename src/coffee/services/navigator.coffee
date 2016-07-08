class Navigator
  'use strict'

  constructor: ($state) ->
    [@state] = arguments

  go: (state, params) ->
    @state.go(state, params).catch (error) ->
      console.log(error)

  home: (params) ->
    @state.go('app.main', params)

app.service('Navigator', Navigator)
