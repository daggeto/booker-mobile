app.factory 'Context', ($q, $rootScope, UsersService, EVENTS) ->
  new class Context
    constructor: ->
      $rootScope.context = {}

      $rootScope.$on EVENTS.UPDATE_CURRENT_USER, @updateCurrentUser

    resolveCurrentUser: ->
      d = $q.defer()

      return @updateCurrentUser() unless @getCurrentUser()

      d.resolve(@getCurrentUser())

      return d.promise

    updateCurrentUser: =>
      $promise = UsersService.current()

      $promise.then (user) =>
        @setCurrentUser(user)

      $promise

    getCurrentUser: ->
      $rootScope.context.currentUser

    setCurrentUser: (user) ->
      $rootScope.context.currentUser = user
