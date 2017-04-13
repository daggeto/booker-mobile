app.factory 'Context', ($q, $rootScope) ->
  new class Context
    constructor: ->
      $rootScope.context = {}

    getCurrentUser: ->
      $rootScope.context.currentUser

    setCurrentUser: (user) ->
      $rootScope.context.currentUser = user
