app.factory 'CurrentUserResolver', ($q, $rootScope, UsersService, Context, EVENTS) ->
  new class CurrentUserResolver
    constructor: ->
      $rootScope.$on EVENTS.UPDATE_CURRENT_USER, @updateCurrentUser

    updateCurrentUser: =>
      $promise = UsersService.current()

      $promise.then (user) =>
        Context.setCurrentUser(user)

      $promise

    resolveCurrentUser: ->
      d = $q.defer()

      return @updateCurrentUser() unless Context.getCurrentUser()

      d.resolve(Context.getCurrentUser())

      return d.promise
