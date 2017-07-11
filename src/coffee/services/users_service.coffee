app.factory 'UsersService', ($cacheFactory, AuthWrapper, User) ->
  new class UsersService
    findById: (id) ->
      AuthWrapper.wrap ->
        User.$r.get(id: id).$promise

    update: (params) ->
      AuthWrapper.wrap ->
        User.$r.update(params).$promise

    current: ->
      User.$current.get().$promise

    reservations: (params) ->
      AuthWrapper.wrap ->
        params.assoc = 'reservations'
        User.$a.get(params).$promise
