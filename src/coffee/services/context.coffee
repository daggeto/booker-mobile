app.factory 'Context', ($q, $rootScope, USER_ROLES) ->
  new class Context
    constructor: ->
      $rootScope.context = {}

    getCurrentUser: ->
      $rootScope.context.currentUser

    setCurrentUser: (user) ->
      $rootScope.context.currentUser = user
